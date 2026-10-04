import { Request, Response } from "express";
import { getOrderPromptPayQR } from "../services/payment.service";

export const generateQR = async (
    req: Request,
    res: Response
) => {

    try {

        const orderId = Number(req.params.orderId);

        const qr = await getOrderPromptPayQR(orderId);

        res.json({
            success: true,
            qr,
        });

    } catch (err: any) {

        res.status(400).json({
            success: false,
            message: err.message,
        });

    }

};