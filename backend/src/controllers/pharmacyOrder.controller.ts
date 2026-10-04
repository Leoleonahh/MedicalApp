import { Request, Response } from "express";
import { getPendingPaymentOrders } from "../services/pharmacyOrder.service";
import { config } from "../config/config";

export const pendingPaymentOrders = async (
    req: Request,
    res: Response
) => {

    try {

        const pharmacyId =
            Number(req.params.pharmacyId);

        const orders =
            await getPendingPaymentOrders(pharmacyId);

        return res.json({

            success: true,

            total: orders.length,

            data: orders.map(order => ({

                order_id: order.order_id,

                customer_name: order.user?.username,

                receiver_name: order.receiver_name,

                receiver_phone: order.receiver_phone,

                delivery_address: order.delivery_address,

                grand_total: order.grand_total,

                payment_slip: order.payment_slip,

                payment_slip_url: order.payment_slip
                    ? `${config.server.baseUrl}/uploads/slips/${order.payment_slip}`
                    : null,

                ocr_amount: order.ocr_amount,

                ocr_datetime: order.ocr_datetime,

                ocr_reference: order.ocr_reference,

                ocr_match: order.ocr_match,

                created_at: order.created_at,

            })),

        });

    } catch (err: any) {

        return res.status(500).json({

            success: false,

            message: err.message,

        });

    }

};