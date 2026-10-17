import { AppDataSource } from "../config/database";

import { Cart } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { PharmacyProduct } from "../entities/PharmacyProduct";
import { Order } from "../entities/Order";
import { OrderItem } from "../entities/OrderItem";
import type { EntityManager } from "typeorm";

const restoreOrderStock = async (manager: EntityManager, orderId: number) => {
    const items = await manager.getRepository(OrderItem).find({
        where: { order_id: orderId },
    });
    const pharmacyProductRepository = manager.getRepository(PharmacyProduct);

    for (const item of items) {
        const pharmacyProduct = await pharmacyProductRepository.findOne({
            where: { pharmacy_product_id: item.pharmacy_product_id },
        });

        if (pharmacyProduct) {
            pharmacyProduct.stock += item.quantity;
            await pharmacyProductRepository.save(pharmacyProduct);
        }
    }
};

const calculateDistanceKilometers = (
        firstLatitude: number,
        firstLongitude: number,
        secondLatitude: number,
        secondLongitude: number
) => {
        const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
        const latitudeDifference = toRadians(secondLatitude - firstLatitude);
        const longitudeDifference = toRadians(secondLongitude - firstLongitude);
        const haversine =
                Math.sin(latitudeDifference / 2) ** 2 +
                Math.cos(toRadians(firstLatitude)) *
                Math.cos(toRadians(secondLatitude)) *
                Math.sin(longitudeDifference / 2) ** 2;

        return 6371 * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
};

export const checkoutOrder = async (data: {
  user_id: number;
  receiver_name: string;
  receiver_phone: string;
  delivery_address: string;
    delivery_latitude: number;
    delivery_longitude: number;
  payment_method: "COD" | "PROMPTPAY";
  note?: string;
}) => {

  return await AppDataSource.transaction(async (manager) => {

    const cartRepository = manager.getRepository(Cart);
    const cartItemRepository = manager.getRepository(CartItem);
    const pharmacyProductRepository = manager.getRepository(PharmacyProduct);
    const orderRepository = manager.getRepository(Order);
    const orderItemRepository = manager.getRepository(OrderItem);

    // ============================
    // ค้นหา Cart
    // ============================

    const cart = await cartRepository.findOne({
      where: {
        user_id: data.user_id,
      },
      relations: [
        "pharmacy",
      ],
    });

    if (!cart) {
      throw new Error("Cart not found");
    }

        const rawStoreLatitude = cart.pharmacy.latitude;
        const rawStoreLongitude = cart.pharmacy.longitude;
        if (rawStoreLatitude == null || rawStoreLongitude == null) {
            throw new Error("ร้านค้าไม่มีพิกัดที่อยู่ จึงไม่สามารถตรวจสอบระยะจัดส่งได้");
        }

        const storeLatitude = Number(rawStoreLatitude);
        const storeLongitude = Number(rawStoreLongitude);
        if (
            !Number.isFinite(storeLatitude) ||
            !Number.isFinite(storeLongitude) ||
            !Number.isFinite(data.delivery_latitude) ||
            !Number.isFinite(data.delivery_longitude)
        ) {
            throw new Error("ไม่สามารถตรวจสอบพิกัดร้านหรือที่อยู่จัดส่งได้");
        }

        const deliveryDistance = calculateDistanceKilometers(
            storeLatitude,
            storeLongitude,
            data.delivery_latitude,
            data.delivery_longitude
        );
        if (deliveryDistance > 5) {
            throw new Error(
                `ที่อยู่จัดส่งอยู่ห่างจากร้าน ${deliveryDistance.toFixed(2)} กม. ร้านจัดส่งได้ไม่เกิน 5 กม.`
            );
        }

    // ============================
    // ดึงสินค้าทั้งหมดใน Cart
    // ============================

    const cartItems = await cartItemRepository.find({
      where: {
        cart_id: cart.cart_id,
      },
      relations: [
        "pharmacyProduct",
        "pharmacyProduct.product",
      ],
    });

    if (cartItems.length === 0) {
      throw new Error("Cart is empty");
    }

    let totalPrice = 0;

    // ============================
    // ตรวจสอบ Stock
    // ============================

    for (const item of cartItems) {

      if (item.quantity > item.pharmacyProduct.stock) {
        throw new Error(
          `${item.pharmacyProduct.product.product_name} stock is insufficient`
        );
      }

      totalPrice +=
        Number(item.pharmacyProduct.price) *
        item.quantity;
    }

    const shippingFee = 0;
    const grandTotal = totalPrice + shippingFee;

    // ============================
    // กำหนดสถานะการชำระเงิน
    // ============================

        const paymentStatus = "UNPAID";

    // ============================
    // สร้าง Order
    // ============================

    const order = orderRepository.create({

      user_id: data.user_id,

      pharmacy_id: cart.pharmacy_id,

      receiver_name: data.receiver_name,

      receiver_phone: data.receiver_phone,

      delivery_address: data.delivery_address,

      total_price: totalPrice,

      shipping_fee: shippingFee,

      grand_total: grandTotal,

      payment_method: data.payment_method,

      payment_status: paymentStatus,

      order_status: "PENDING",

      note: data.note,

    });

    const savedOrder = await orderRepository.save(order);

    // ============================
    // สร้าง OrderItem และตัด Stock
    // ============================

    for (const item of cartItems) {

      const subtotal =
        Number(item.pharmacyProduct.price) *
        item.quantity;

      const orderItem = orderItemRepository.create({

        order_id: savedOrder.order_id,

        pharmacy_product_id:
          item.pharmacyProduct.pharmacy_product_id,

        product_name:
          item.pharmacyProduct.product.product_name,

        unit_price:
          item.pharmacyProduct.price,

        quantity:
          item.quantity,

        subtotal,

      });

      await orderItemRepository.save(orderItem);

      // ลด Stock

      item.pharmacyProduct.stock -= item.quantity;

      await pharmacyProductRepository.save(
        item.pharmacyProduct
      );

    }

    // ============================
    // ล้าง Cart
    // ============================

    await cartItemRepository.delete({
      cart_id: cart.cart_id,
    });

    await cartRepository.delete({
      cart_id: cart.cart_id,
    });

    // ============================
    // Response
    // ============================

    return {

      order_id: savedOrder.order_id,

      payment_method: savedOrder.payment_method,

      payment_status: savedOrder.payment_status,

      order_status: savedOrder.order_status,

      total_price: totalPrice,

      shipping_fee: shippingFee,

      grand_total: grandTotal,

    };

  });

};

// เปลี่ยนสถานะ Order
export const updateOrderStatus = async (
    orderId: number,
    userId: number,
    orderStatus: string,
    deliveryProof?: string
) => {

    return await AppDataSource.transaction((manager) =>
        updateOrderStatusInTransaction(
            manager,
            orderId,
            userId,
            orderStatus,
            deliveryProof
        )
    );
};

const updateOrderStatusInTransaction = async (
    manager: EntityManager,
    orderId: number,
    userId: number,
    orderStatus: string,
    deliveryProof?: string
) => {
    const orderRepository = manager.getRepository(Order);

    const order =
        await orderRepository.findOne({

            where: {
                order_id: orderId,
            },

            // โหลด Pharmacy ของ Order
            relations: [
                "pharmacy",
            ],
            lock: {
                mode: "pessimistic_write",
            },

        });

    if (!order) {
        throw new Error("Order not found");
    }

    // ==========================================
    // ตรวจสอบว่า Order มี Pharmacy หรือไม่
    // ==========================================

    if (!order.pharmacy) {

        throw new Error(
            "Pharmacy not found"
        );

    }

    // ==========================================
    // ตรวจสอบว่า User เป็นเจ้าของร้าน
    // ==========================================

    if (
        order.pharmacy.user_id !== userId
    ) {

        throw new Error(
            "You are not allowed to update this order"
        );

    }

    // ==========================================
    // PromptPay ต้องชำระเงินก่อน
    // ==========================================

    if (
        orderStatus !== "CANCELLED" &&
        order.payment_method === "PROMPTPAY" &&
        order.payment_status !== "PAID"
    ) {

        throw new Error(
            "Payment has not been confirmed"
        );

    }

    // ==========================================
    // ลำดับการเปลี่ยนสถานะ
    // ==========================================

    const statusFlow: Record<string, string[]> = {

        PENDING: [
            "PREPARING",
            "CANCELLED",
        ],

        PREPARING: [
            "SHIPPING",
            "CANCELLED",
        ],

        SHIPPING: [
            "DELIVERED",
        ],

        DELIVERED: [],

        CANCELLED: [],

    };

    // ==========================================
    // ตรวจสอบสถานะปัจจุบัน
    // ==========================================

    const nextStatus =
        statusFlow[order.order_status];

    if (!nextStatus) {

        throw new Error(
            "Invalid current order status"
        );

    }

    // ==========================================
    // ตรวจสอบว่าสามารถเปลี่ยนสถานะได้หรือไม่
    // ==========================================

    if (!nextStatus.includes(orderStatus)) {

        throw new Error(
            `Cannot change status from ${order.order_status} to ${orderStatus}`
        );

    }

    if (orderStatus === "DELIVERED" && !deliveryProof) {
        throw new Error("กรุณาแนบรูปหลักฐานการจัดส่งก่อนยืนยันจัดส่งเรียบร้อย");
    }

    // ==========================================
    // อัปเดตสถานะ
    // ==========================================

    if (orderStatus === "CANCELLED") {
        await restoreOrderStock(manager, orderId);
    }

    if (deliveryProof) {
        order.delivery_proof = deliveryProof;
    }

    if (orderStatus === "DELIVERED" && order.payment_method === "COD") {
        order.payment_status = "PAID";
    }

    order.order_status = orderStatus;

    await orderRepository.save(order);

    return order;
};

// ประวัติการสั่งซื้อของลูกค้า
export const getOrdersByUser = async (
    userId: number
) => {

    const orderRepository =
        AppDataSource.getRepository(Order);

    const orders =
        await orderRepository.find({

            where: {
                user_id: userId,
            },

            relations: [
                "pharmacy",
            ],

            order: {
                created_at: "DESC",
            },

        });

    return orders;

};

// รายละเอียด Order
export const getOrderDetail = async (
    orderId: number
) => {

    const orderRepository =
        AppDataSource.getRepository(Order);

    const order =
        await orderRepository.findOne({

            where: {

                order_id: orderId,

            },

            relations: [

                "pharmacy",

            ],

        });

    if (!order)
        throw new Error("Order not found");

    const orderItemRepository =
        AppDataSource.getRepository(OrderItem);

    const items =
        await orderItemRepository.find({

            where: {

                order_id: orderId,

            },

        });

    return {

        ...order,

        items,

    };

};

// ดูรายการ Order ของร้าน
export const getOrdersByPharmacy = async (
    pharmacyId: number,
    status?: string
) => {

    const orderRepository =
        AppDataSource.getRepository(Order);

    const where: any = {
        pharmacy_id: pharmacyId,
    };

    if (status) {
        where.order_status = status;
    }

    const orders =
        await orderRepository.find({

            where,

            relations: [
                "user",
            ],

            order: {
                created_at: "DESC",
            },

        });

    return orders;

};

// ยกเลิก Order
export const cancelOrder = async (
    orderId: number,
    userId: number
) => {
    

    return await AppDataSource.transaction(async (manager) => {

        const orderRepository =
            manager.getRepository(Order);

        const order =
            await orderRepository.findOne({

                where: {
                    order_id: orderId,
                },
                lock: {
                    mode: "pessimistic_write",
                },

            });

        if (!order)
            throw new Error("Order not found");

        // ตรวจสอบเจ้าของ Order
        if (order.user_id !== userId) {
            throw new Error("You are not the owner of this order.");
        }

        // PromptPay ที่ชำระเงินแล้ว ไม่สามารถยกเลิกได้
        if (
            order.payment_method === "PROMPTPAY" &&
            order.payment_status === "PAID"
        ) {

            throw new Error(
                "This order has already been paid. Please contact the pharmacy for a refund."
            );

        }

        // ตรวจสอบสถานะ Order
        switch (order.order_status) {

            case "PENDING":
            case "PREPARING":
                // ยกเลิกได้
                break;

            case "SHIPPING":
                throw new Error(
                    "This order has already been shipped and cannot be cancelled."
                );

            case "DELIVERED":
                throw new Error(
                    "This order has already been delivered and cannot be cancelled."
                );

            case "CANCELLED":
                throw new Error(
                    "This order has already been cancelled."
                );

            default:
                throw new Error(
                    "This order cannot be cancelled."
                );

        }

        // คืน Stock
        await restoreOrderStock(manager, orderId);

        // เปลี่ยนสถานะ Order
        order.order_status = "CANCELLED";

        await orderRepository.save(order);

        return order;

    });

};

// รายละเอียด Order ของร้าน
export const getPharmacyOrderDetail = async (
    orderId: number
) => {

    const orderRepository =
        AppDataSource.getRepository(Order);

    const order =
        await orderRepository.findOne({

            where: {

                order_id: orderId,

            },

            relations: [

                "user",

                "pharmacy",

            ],

        });

    if (!order)
        throw new Error("Order not found");

    const orderItemRepository =
        AppDataSource.getRepository(OrderItem);

    const items =
        await orderItemRepository.find({

            where: {

                order_id: orderId,

            },

        });

    return {

        order,

        items,

    };

};