import { Router } from "express";

import {
    addProductToCart,getUserCart,updateCartItemQuantity,deleteCartItem,clearUserCart
} from "../controllers/cart.controller";
import { authMiddleware } from "../services/auth.service";

const router = Router();

router.post(
    "/add",
    authMiddleware,
    addProductToCart
);

router.get(
    "/",
    authMiddleware,
    getUserCart
);

router.put(
    "/item/:cartItemId",
    authMiddleware,
    updateCartItemQuantity
);

router.put(
    "/:cartItemId",
    authMiddleware,
    updateCartItemQuantity
);

router.delete(
    "/clear",
    authMiddleware,
    clearUserCart
);

router.delete(
    "/item/:cartItemId",
    authMiddleware,
    deleteCartItem
);

router.delete(
    "/:cartItemId",
    authMiddleware,
    deleteCartItem
);


export default router;