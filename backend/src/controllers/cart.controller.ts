import { Request, Response } from "express";
import { addToCart } from "../services/cart.service";
import { getCart } from "../services/cart.service";
import {updateCartItem} from "../services/cart.service";
import {removeCartItem} from "../services/cart.service";
import {clearCart} from "../services/cart.service";

//-------------------------------เพิ่มสินค้าในตะกร้า--------------------------------------------
export const addProductToCart = async (
    req: Request & { user?: any },
    res: Response
) => {

    try {

        const user_id = req.user?.user_id;

        const {
            pharmacy_product_id,
            quantity
        } = req.body;

        const result = await addToCart(
            user_id,
            pharmacy_product_id,
            quantity
        );

        return res.json({
            success: true,
            message: "Add product to cart successfully",
            data: result
        });

    } catch (err: any) {

        return res.status(400).json({
            success: false,
            message: err.message
        });

    }

};

//-------------------------------ดูสินค้าในตะกร้า--------------------------------------------
export const getUserCart = async (
  req: Request & { user?: any },
  res: Response
) => {

  try {

    const userId = req.user?.user_id;

    const result = await getCart(userId);

    return res.json({
      success: true,
      data: result
    });

  } catch (err: any) {

    return res.status(404).json({
      success: false,
      message: err.message
    });

  }

};

//-------------------------------แก้ไขจำนวนสินค้าในตะกร้า--------------------------------------------
export const updateCartItemQuantity = async (
  req: Request,
  res: Response
) => {

  try {

    const cartItemId = Number(req.params.cartItemId);

    const { quantity } = req.body;

    const result = await updateCartItem(
      cartItemId,
      quantity
    );

    return res.json({

      success: true,

      message: "Cart updated successfully",

      data: result

    });

  } catch (err: any) {

    return res.status(400).json({

      success: false,

      message: err.message

    });

  }

};

//-------------------------------ลบสินค้าในตะกร้า--------------------------------------------
export const deleteCartItem = async (
  req: Request,
  res: Response
) => {

  try {

    const cartItemId = Number(req.params.cartItemId);

    const result = await removeCartItem(cartItemId);

    return res.json({

      success: true,

      ...result

    });

  } catch (err: any) {

    return res.status(404).json({

      success: false,

      message: err.message

    });

  }

};

//-------------------------------ล้างตะกร้า--------------------------------------------
export const clearUserCart = async (
  req: Request & { user?: any },
  res: Response
) => {

  try {

    const userId = req.user?.user_id;

    const result = await clearCart(userId);

    return res.json({
      success: true,
      ...result
    });

  } catch (err: any) {

    return res.status(404).json({
      success: false,
      message: err.message
    });

  }

};