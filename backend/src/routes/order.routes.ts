import { Router } from "express";
import { cancelOrderController, checkout, getOrderDetailController, getOrdersByPharmacyController, getOrdersByUserController, getPharmacyOrderDetailController, updateStatus } from "../controllers/order.controller";
import { generateQR } from "../controllers/order.payment.controller";
import { authMiddleware } from "../services/auth.service";

const router = Router();

router.post(
    "/checkout",
    authMiddleware,
    checkout
);

router.get(
    "/:orderId/qrcode",
    authMiddleware,
    generateQR
);

router.put(
    "/:orderId/status",
    authMiddleware,
    updateStatus
);

router.get(
    "/my-orders",
    authMiddleware,
    getOrdersByUserController
);

router.get(
    "/:orderId",
    authMiddleware,
    getOrderDetailController
);

router.get(
    "/pharmacy/:pharmacyId/orders",
    getOrdersByPharmacyController
);

router.put(
    "/:orderId/cancel",
    authMiddleware,
    cancelOrderController
);

router.get(
    "/pharmacy/orders/:orderId",
    getPharmacyOrderDetailController
);

export default router;