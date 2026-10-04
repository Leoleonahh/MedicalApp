import { Router } from "express";
import { pendingPaymentOrders } from "../controllers/pharmacyOrder.controller";

const router = Router();

router.get(
    "/:pharmacyId/orders/pending-payment",
    pendingPaymentOrders
);

export default router;