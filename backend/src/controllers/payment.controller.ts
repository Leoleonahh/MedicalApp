import { Request, Response } from "express";
import { uploadPaymentSlip } from "../services/payment.service";
import { confirmPayment } from "../services/payment.service";
import { rejectPayment } from "../services/payment.service";

export const uploadSlip = async (
  req: Request,
  res: Response
) => {

  try {

    const orderId = Number(req.params.orderId);

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await uploadPaymentSlip(
        orderId,
        req.file.filename
    );

    return res.json({
        success: true,
        message: "Slip uploaded successfully",
        data: {
            payment_slip: result.order.payment_slip,

            ocr: {
                amount: result.slip.amount,
                datetime: result.slip.datetime,
                reference: result.slip.reference,
                match: result.match,
            },
        },
    });

  } catch (err: any) {

    return res.status(400).json({
      success: false,
      message: err.message,
    });

  }

};

// ===============================
// Confirm Payment
// ===============================
export const confirmPaymentController = async (
    req: Request,
    res: Response
) => {

    try {

        const orderId = Number(req.params.orderId);

        const { verified_by } = req.body;

        const order = await confirmPayment(
            orderId,
            verified_by
        );

        return res.json({

            success: true,

            message: "Payment confirmed successfully",

            data: {

                order_id: order.order_id,

                payment_status: order.payment_status,

                verified_at: order.verified_at,

                verified_by: order.verified_by,

            },

        });

    } catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};

// ===============================
// Reject Payment
// ===============================
export const rejectPaymentController = async (
    req: Request,
    res: Response
) => {

    try {

        const orderId = Number(req.params.orderId);

        const {
            verified_by,
            reason,
        } = req.body;

        const order = await rejectPayment(
            orderId,
            verified_by,
            reason
        );

        return res.json({

            success: true,

            message: "Payment rejected",

            data: {

                order_id: order.order_id,

                payment_status: order.payment_status,

                reject_reason: order.reject_reason,

            },

        });

    } catch (err: any) {

        return res.status(400).json({

            success: false,

            message: err.message,

        });

    }

};