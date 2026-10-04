import { AppDataSource } from "../config/database";

import { Cart } from "../entities/Cart";
import { CartItem } from "../entities/CartItem";
import { PharmacyProduct } from "../entities/PharmacyProduct";

const cartRepository = AppDataSource.getRepository(Cart);
const cartItemRepository = AppDataSource.getRepository(CartItem);
const pharmacyProductRepository = AppDataSource.getRepository(PharmacyProduct);

export const addToCart = async (
  userId: number,
  pharmacyProductId: number,
  quantity: number
) => {

  // 1. ตรวจสอบจำนวนสินค้า
  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  // 2. ค้นหาสินค้า
  const pharmacyProduct = await pharmacyProductRepository.findOne({
    where: {
      pharmacy_product_id: pharmacyProductId,
    },
    relations: ["pharmacy", "product"],
  });

  if (!pharmacyProduct) {
    throw new Error("Product not found");
  }

  // 3. ตรวจสอบ Stock
  if (pharmacyProduct.stock < quantity) {
    throw new Error("Insufficient stock");
  }

  // 4. ตรวจสอบว่ามี Cart ของร้านอื่นหรือไม่
  const existingCart = await cartRepository.findOne({
    where: {
      user_id: userId,
    },
    relations: ["pharmacy"],
  });

  if (
    existingCart &&
    existingCart.pharmacy_id !== pharmacyProduct.pharmacy_id
  ) {
    throw new Error(
      `คุณมีสินค้าจากร้าน "${existingCart.pharmacy.pharmacy_name}" อยู่ในตะกร้า กรุณาล้างตะกร้าก่อน`
    );
  }

  // 5. หา Cart ของร้านปัจจุบัน
  let cart = await cartRepository.findOne({
    where: {
      user_id: userId,
      pharmacy_id: pharmacyProduct.pharmacy_id,
    },
  });

  // 6. ถ้ายังไม่มี Cart ให้สร้างใหม่
  if (!cart) {
    cart = cartRepository.create({
      user_id: userId,
      pharmacy_id: pharmacyProduct.pharmacy_id,
    });

    cart = await cartRepository.save(cart);
  }

  // 7. ตรวจสอบว่ามีสินค้านี้อยู่ใน Cart แล้วหรือยัง
  let cartItem = await cartItemRepository.findOne({
    where: {
      cart_id: cart.cart_id,
      pharmacy_product_id: pharmacyProductId,
    },
  });

  // 8. ถ้ามีแล้ว เพิ่มจำนวน
  if (cartItem) {

    const newQuantity = cartItem.quantity + quantity;

    if (newQuantity > pharmacyProduct.stock) {
      throw new Error("Insufficient stock");
    }

    cartItem.quantity = newQuantity;

    await cartItemRepository.save(cartItem);

  } else {

    // 9. ถ้ายังไม่มี สร้างรายการใหม่
    cartItem = cartItemRepository.create({
      cart_id: cart.cart_id,
      pharmacy_product_id: pharmacyProductId,
      quantity,
    });

    await cartItemRepository.save(cartItem);

  }

  // 10. ส่งข้อมูลกลับ
  return {
    cart_id: cart.cart_id,
    pharmacy_id: pharmacyProduct.pharmacy_id,
    pharmacy_name: pharmacyProduct.pharmacy.pharmacy_name,
    product_name: pharmacyProduct.product.product_name,
    quantity: cartItem.quantity,
    price: pharmacyProduct.price,
    subtotal: pharmacyProduct.price * cartItem.quantity,
  };

};

//-------------------------------ดูสินค้าในตะกร้า--------------------------------------------

export const getCart = async (userId: number) => {

  // 1. หาตะกร้าของผู้ใช้
  const cart = await cartRepository.findOne({
    where: {
      user_id: userId,
    },
    relations: [
      "pharmacy",
    ],
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  // 2. ดึงสินค้าทั้งหมดในตะกร้า
  const items = await cartItemRepository.find({
    where: {
      cart_id: cart.cart_id,
    },
    relations: [
        "pharmacyProduct",
        "pharmacyProduct.product",
        "pharmacyProduct.product.typepro",
    ]
  });

  // 3. คำนวณยอดรวม
  let totalPrice = 0;
  let totalQuantity = 0;

  const cartItems = items.map(item => {

    const subtotal =
      Number(item.pharmacyProduct.price) * item.quantity;

    totalPrice += subtotal;
    totalQuantity += item.quantity;

    return {

      cart_item_id: item.cart_item_id,

      pharmacy_product_id:
        item.pharmacyProduct.pharmacy_product_id,

      product_id:
        item.pharmacyProduct.product.product_id,

      product_name:
        item.pharmacyProduct.product.product_name,

      image:
        item.pharmacyProduct.product.image,

      type:
        item.pharmacyProduct.product.typepro?.type_name,

      price:
        item.pharmacyProduct.price,

      stock:
        item.pharmacyProduct.stock,

      quantity:
        item.quantity,

      subtotal

    };

  });

  return {

    cart_id: cart.cart_id,

    pharmacy: {

      pharmacy_id:
        cart.pharmacy.pharmacy_id,

      pharmacy_name:
        cart.pharmacy.pharmacy_name

    },

    items: cartItems,

    total_price: totalPrice,

    total_quantity: totalQuantity

  };

};

//------------------------------updateสินค้า----------------------------------------
export const updateCartItem = async (
  cartItemId: number,
  quantity: number
) => {

  if (quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  // ค้นหา CartItem
  const cartItem = await cartItemRepository.findOne({
    where: {
      cart_item_id: cartItemId,
    },
    relations: [
      "pharmacyProduct",
      "pharmacyProduct.product",
    ],
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  // เช็ค stock
  if (quantity > cartItem.pharmacyProduct.stock) {
    throw new Error("Insufficient stock");
  }

  // Update
  cartItem.quantity = quantity;

  await cartItemRepository.save(cartItem);

  return {

    cart_item_id: cartItem.cart_item_id,

    product_name:
      cartItem.pharmacyProduct.product.product_name,

    quantity:
      cartItem.quantity,

    price:
      cartItem.pharmacyProduct.price,

    subtotal:
      Number(cartItem.pharmacyProduct.price) *
      cartItem.quantity

  };

};

//------------------------------ลบสินค้า----------------------------------------
export const removeCartItem = async (
  cartItemId: number
) => {

  // 1. หา CartItem
  const cartItem = await cartItemRepository.findOne({
    where: {
      cart_item_id: cartItemId,
    },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

  const cartId = cartItem.cart_id;

  // 2. ลบสินค้า
  await cartItemRepository.remove(cartItem);

  // 3. ตรวจสอบว่ายังมีสินค้าเหลือหรือไม่
  const remainItems = await cartItemRepository.count({
    where: {
      cart_id: cartId,
    },
  });

  // 4. ถ้าไม่เหลือสินค้า ลบ Cart
  if (remainItems === 0) {

    const cart = await cartRepository.findOne({
      where: {
        cart_id: cartId,
      },
    });

    if (cart) {
      await cartRepository.remove(cart);
    }

    return {
      cart_deleted: true,
      message: "Cart is empty and has been deleted"
    };

  }

  return {
    cart_deleted: false,
    message: "Product removed successfully"
  };

};

//------------------------------ล้างตะกร้า----------------------------------------
export const clearCart = async (
  userId: number
) => {

  // 1. หา Cart ของผู้ใช้
  const cart = await cartRepository.findOne({
    where: {
      user_id: userId,
    },
  });

  if (!cart) {
    throw new Error("Cart not found");
  }

  // 2. ลบสินค้าทั้งหมดใน Cart
  await cartItemRepository.delete({
    cart_id: cart.cart_id,
  });

  // 3. ลบ Cart
  await cartRepository.remove(cart);

  return {
    message: "Cart cleared successfully",
  };

};