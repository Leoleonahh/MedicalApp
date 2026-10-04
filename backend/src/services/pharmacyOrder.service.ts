import { AppDataSource } from "../config/database";
import { Order } from "../entities/Order";

const orderRepository =
    AppDataSource.getRepository(Order);

export const getPendingPaymentOrders = async (
    pharmacyId: number
) => {

    const orders = await orderRepository.find({

        where: {

            pharmacy_id: pharmacyId,

            payment_status: "PENDING_VERIFY",

        },

        relations: [
            "user",
        ],

        order: {
            created_at: "DESC",
        },

    });

    return orders;

};