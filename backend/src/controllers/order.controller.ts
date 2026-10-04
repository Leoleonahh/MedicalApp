import { Request, Response } from "express";
import { checkoutOrder } from "../services/order.service";
import { updateOrderStatus } from "../services/order.service";
import { getOrdersByUser } from "../services/order.service";
import { getOrderDetail } from "../services/order.service";
import { getOrdersByPharmacy } from "../services/order.service";
import { cancelOrder } from "../services/order.service";
import { getPharmacyOrderDetail } from "../services/order.service";
import { AppDataSource } from "../config/database";
import { OrderItem } from "../entities/OrderItem";

export const checkout = async (
  req: Request & { user?: any },
  res: Response
) => {

  try {

    const user_id = req.user?.user_id;
    
    if (!user_id) {
    return res.status(401).json({
        success: false,
        message: "Unauthorized",
    });
}

    const {
    receiver_name,
    receiver_phone,
    delivery_address,
    payment_method,
    note,
    } = req.body;

    // ตรวจสอบวิธีการชำระเงิน
    if (
      payment_method !== "COD" &&
      payment_method !== "PROMPTPAY"
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method",
      });
    }

    const result = await checkoutOrder({
      user_id,
      receiver_name,
      receiver_phone,
      delivery_address,
      payment_method,
      note,
    });

    return res.status(201).json({
      success: true,
      message: "Checkout successfully",
      data: result,
    });

  } catch (err: any) {

    return res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};

//อัพเดดสถานะ order
export const updateStatus = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const orderId =
            Number(req.params.orderId);

        const orderStatus =
            req.body.order_status;

        const userId =
            req.user?.user_id;

        if (!userId) {

            return res.status(401).json({
                success: false,
                message: "Unauthorized",
            });

        }

        const order =
            await updateOrderStatus(
                orderId,
                userId,
                orderStatus
            );

        return res.json({

            success: true,

            message:
                "Order status updated successfully",

            data: {

                order_id:
                    order.order_id,

                order_status:
                    order.order_status,

            },

        });

    } catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }
};


// ดึง Order ของผู้ใช้
export const getOrdersByUserController = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const userId = req.user?.user_id;

        const orders =
            await getOrdersByUser(userId);

        return res.json({

            success: true,

            total: orders.length,

            data: await Promise.all(orders.map(async order => ({

                order_id:
                    order.order_id,

                pharmacy_name:
                    order.pharmacy.pharmacy_name,

                receiver_name: 
                    order.receiver_name,

                receiver_phone: 
                    order.receiver_phone,

                delivery_address: 
                    order.delivery_address,

                grand_total:
                    order.grand_total,

                payment_method:
                    order.payment_method,

                payment_status:
                    order.payment_status,

                order_status:
                    order.order_status,

                created_at:
                    order.created_at,

                items: await AppDataSource.getRepository(OrderItem).find({
                    where: { order_id: order.order_id },
                }),

            }))),

        });

    }

    catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};

// ดึงรายละเอียด Order
export const getOrderDetailController = async (

    req: Request,

    res: Response

) => {

    try {

        const orderId =
            Number(req.params.orderId);

        const order =
            await getOrderDetail(orderId);

        return res.json({

            success: true,

            data: order,

        });

    }

    catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};

// ดึง Order ของร้านขายยา

export const getOrdersByPharmacyController = async (
    req: Request,
    res: Response
) => {

    try {

        const pharmacyId =
            Number(req.params.pharmacyId);

        const status =
            req.query.status as string | undefined;

        const orders =
            await getOrdersByPharmacy(
                pharmacyId,
                status
            );

        return res.json({

            success: true,

            total: orders.length,

            data: orders.map(order => ({

                order_id: order.order_id,

                customer_name: order.user.username,

                receiver_name: order.receiver_name,

                receiver_phone: order.receiver_phone,

                delivery_address: order.delivery_address,

                grand_total: order.grand_total,

                payment_method: order.payment_method,

                payment_status: order.payment_status,

                ocr_match: order.ocr_match,

                order_status: order.order_status,

                created_at: order.created_at,

            })),

        });

    }

    catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};

export const cancelOrderController = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const order =
            await cancelOrder(
                Number(req.params.orderId),
                req.user.user_id
            );

        return res.json({

            success: true,

            message: "Order cancelled successfully",

            data: {

                order_id:
                    order.order_id,

                order_status:
                    order.order_status,

            },

        });

    }

    catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};

// ดึงรายละเอียด Order ของร้านขายยา
export const getPharmacyOrderDetailController = async (

    req: Request,

    res: Response

) => {

    try {

        const result =
            await getPharmacyOrderDetail(

                Number(req.params.orderId)

            );

        return res.json({

            success: true,

            data: result,

        });

    }

    catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};