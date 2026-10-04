import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./ShopOrders.css";

function ShopOrders() {
  const [orders, setOrders] = useState([]);

  async function confirmPayment(orderId) {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      const response = await api.put(`/orders/${orderId}/confirm-payment`, {
        verified_by: user?.user_id || null,
      });
      const paymentStatus = response.data?.data?.payment_status || "PAID";

      setOrders((currentOrders) => {
        const updatedOrders = currentOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                payment_status: paymentStatus,
                paid: true,
              }
            : order
        );

        localStorage.setItem("shop_orders", JSON.stringify(updatedOrders));
        return updatedOrders;
      });
    } catch (error) {
      console.error("Failed to confirm payment", error);
      alert(error.response?.data?.message || "ไม่สามารถยืนยันการชำระเงินได้");
    }
  }

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const response = await api.get("/orders/pharmacy/1/orders");
        const data = response.data?.data || [];
        const mappedOrders = data.map((order) => {
          const isCashOnDelivery = order.payment_method === "COD";
          const isPaymentVerified =
            order.payment_status === "PAID" || order.ocr_match === true;

          return {
            ...order,
            id: order.order_id,
            code: `ออเดอร์${String(order.order_id).padStart(3, "0")}`,
            payment: order.payment_method,
            paid: isCashOnDelivery || isPaymentVerified,
            recipient: order.receiver_name,
            phone: order.receiver_phone,
            address: order.delivery_address,
            total: order.grand_total,
            status: order.order_status,
          };
        });

        setOrders(mappedOrders);
        localStorage.setItem("shop_orders", JSON.stringify(mappedOrders));
      } catch (error) {
        console.error("Failed to load pharmacy orders", error);
      }
    };

    loadOrders();
  }, []);

  return (
    <div className="orders-page">
      <div className="left-accent" />

      <div className="orders-container">
        <header className="orders-header">
          <Link to="/shop/manage" className="manage-back">
            <FaArrowLeft />
          </Link>
          <h1 className="orders-title">ออเดอร์ทั้งหมด</h1>
        </header>

        <div className="orders-list">
          {orders.map((o) => (
            <div key={o.id} className="order-card-link">
              <div className="order-card">
                <Link to={`/shop/orders/${o.id}`} className="order-left order-code-link">
                  {o.code}
                </Link>
                <div className="order-status">สถานะ: {o.status}</div>
                <div className={"order-right " + (o.paid ? "paid" : "unpaid")}>
                  <div>{o.payment === "COD" ? "เก็บเงินปลายทาง" : "PromptPay"}</div>
                  <div>{o.paid ? "ชำระเงินแล้ว" : "ยังไม่ชำระเงิน"}</div>
                  <div>{o.paid ? "เรียบร้อย" : "ไม่เรียบร้อย"}</div>
                </div>
                <button
                  type="button"
                  className="confirm-payment-button"
                  onClick={() => confirmPayment(o.id)}
                  disabled={o.payment === "COD" || o.payment_status === "PAID"}
                >
                  {o.payment_status === "PAID" ? "ยืนยันแล้ว" : "ยืนยันการชำระเงิน"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShopOrders;
