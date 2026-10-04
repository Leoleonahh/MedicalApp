import { Router } from "express";

import { confirmPaymentController, rejectPaymentController, uploadSlip } from "../controllers/payment.controller";

import { uploadSlip as uploadMiddleware }
from "../middlewares/uploadSlip";

const router = Router();

router.post(

    "/orders/:orderId/upload-slip",

    uploadMiddleware.single("slip"),

    uploadSlip

);

router.put(
    "/orders/:orderId/confirm-payment",
    confirmPaymentController
);

router.put(
    "/orders/:orderId/reject-payment",
    rejectPaymentController
);

export default router;