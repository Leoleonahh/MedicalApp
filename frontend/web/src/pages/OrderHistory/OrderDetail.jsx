import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { getOrderDetail } from "../../api/cart.api";
import api from "../../api/axios";
import "./OrderHistory.css";

const API_URL = import.meta.env.VITE_API_URL;

function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const slipFilename = order?.payment_slip || order?.slip;
  const slipUrl = slipFilename
    ? slipFilename.startsWith("http://") || slipFilename.startsWith("https://")
      ? slipFilename
      : `${API_URL}/uploads/slips/${encodeURIComponent(slipFilename)}`
    : "";
  const deliveryProofUrl = order?.delivery_proof
    ? `${API_URL}/uploads/delivery-proofs/${encodeURIComponent(order.delivery_proof)}`
    : "";
  const paymentMethod = String(order?.payment_method || "").toUpperCase();
  const orderStatus = String(order?.order_status || "").toUpperCase();
  const paymentStatus =
    paymentMethod === "COD" && orderStatus === "DELIVERED"
      ? "PAID"
      : String(order?.payment_status || "").toUpperCase();
  const orderStatusLabels = {
    PENDING: "รอจัดส่ง",
    PREPARING: "กำลังเตรียมสินค้า",
    SHIPPING: "กำลังจัดส่ง",
    DELIVERED: "จัดส่งเรียบร้อย",
    CANCELLED: "ยกเลิกแล้ว",
  };
  const canPay =
    paymentMethod === "PROMPTPAY" &&
    !slipFilename &&
    paymentStatus !== "PAID";

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const result = await getOrderDetail(id);
        setOrder(result.data || result.order || null);
      } catch (requestError) {
        console.error("Load order detail error:", requestError);
        setError(requestError.response?.data?.message || "ไม่สามารถโหลดรายละเอียดคำสั่งซื้อได้");
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [id]);

  async function cancelOrder() {
    if (!order) return;
    if (!window.confirm("ยืนยันการยกเลิกคำสั่งซื้อ?")) return;

    try {
      const response = await api.put(`/orders/${order.order_id}/cancel`);
      const cancelledStatus = response.data?.data?.order_status || "CANCELLED";

      setOrder({ ...order, order_status: cancelledStatus });

      const raw = localStorage.getItem("medicalapp_orders") || "[]";
      const orders = JSON.parse(raw);
      const next = orders.map((savedOrder) =>
        String(savedOrder.order_id || savedOrder.id) === String(order.order_id)
          ? { ...savedOrder, order_status: cancelledStatus, status: "ยกเลิก" }
          : savedOrder
      );
      localStorage.setItem("medicalapp_orders", JSON.stringify(next));

      const raw2 = localStorage.getItem("shop_orders") || "[]";
      const shopOrders = JSON.parse(raw2);
      const nextShop = shopOrders.map((shopOrder) =>
        String(shopOrder.order_id || shopOrder.id) === String(order.order_id)
          ? { ...shopOrder, order_status: cancelledStatus, status: "ยกเลิก" }
          : shopOrder
      );
      localStorage.setItem("shop_orders", JSON.stringify(nextShop));

      alert("ยกเลิกคำสั่งซื้อเรียบร้อย");
      return;
    } catch (requestError) {
      console.error("Cancel order error:", requestError);
      alert(requestError.response?.data?.message || "ไม่สามารถยกเลิกคำสั่งซื้อได้");
      return;
    }

  }

  const handlePayment = () => {
    localStorage.setItem(
      "pending_payment",
      JSON.stringify({
        order,
        cart: (order.items || []).map((item) => ({
          ...item,
          name: item.product_name,
          price: item.unit_price,
        })),
      })
    );
    navigate("/payment");
  };

  if (loading || !order) {
    return (
      <div className="order-history-page">
        <div className="order-history-top">
          <button className="order-history-back" onClick={() => navigate(-1)}>
            <FaArrowLeft />
          </button>
          <div>
            <p className="order-history-subtitle">รายละเอียดคำสั่งซื้อ</p>
            <h1>{loading ? "กำลังโหลด..." : "ไม่พบคำสั่งซื้อ"}</h1>
          </div>
        </div>
        <div style={{ padding: 24 }}>
          <p>{error || "ไม่พบคำสั่งซื้อที่ร้องขอ"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="order-history-page">
      <div className="order-history-top">
        <button className="order-history-back" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div>
          <p className="order-history-subtitle">รายละเอียดคำสั่งซื้อ</p>
          <h1>คำสั่งซื้อ #{order.order_id}</h1>
        </div>
      </div>

      <div className="order-detail-container">
        <article className="order-detail-card">
          <header className="order-detail-heading">
            <div>
              <span className="order-detail-eyebrow">ORDER SUMMARY</span>
              <h2>คำสั่งซื้อ #{order.order_id}</h2>
              <p>
                {order.created_at
                  ? new Date(order.created_at).toLocaleString("th-TH", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "ไม่ระบุวันที่"}
              </p>
            </div>
            <span className={`order-detail-status status-${String(order.order_status || "").toLowerCase()}`}>
              {orderStatusLabels[order.order_status] || order.order_status}
            </span>
          </header>

          <section className="order-detail-section">
            <h3>ข้อมูลจัดส่ง</h3>
            <div className="order-detail-info-grid">
              <div className="order-detail-info">
                <span>ร้านค้า</span>
                <strong>{order.pharmacy?.pharmacy_name || "-"}</strong>
              </div>
              <div className="order-detail-info">
                <span>ผู้รับ</span>
                <strong>{order.receiver_name || "-"}</strong>
              </div>
              <div className="order-detail-info">
                <span>เบอร์โทรศัพท์</span>
                <strong>{order.receiver_phone || "-"}</strong>
              </div>
              <div className="order-detail-info address-info">
                <span>ที่อยู่จัดส่ง</span>
                <strong>{order.delivery_address || "-"}</strong>
              </div>
            </div>
          </section>

          <section className="order-detail-section">
            <div className="order-detail-section-title">
              <h3>รายการสินค้า</h3>
              <span>{(order.items || []).length} รายการ</span>
            </div>
            <div className="customer-order-items">
              {(order.items || []).map((item, index) => (
                <div className="customer-order-item" key={item.order_item_id || index}>
                  <div>
                    <strong>{item.product_name}</strong>
                    <span>จำนวน {item.quantity} ชิ้น · ฿{item.unit_price} / ชิ้น</span>
                  </div>
                  <strong>฿{item.subtotal}</strong>
                </div>
              ))}
            </div>
            <div className="order-detail-total">
              <span>ยอดรวมทั้งหมด</span>
              <strong>฿{order.grand_total}</strong>
            </div>
          </section>

          <section className="order-detail-section payment-section">
            <h3>การชำระเงิน</h3>
            <div className="order-detail-info-grid">
              <div className="order-detail-info">
                <span>วิธีชำระเงิน</span>
                <strong>{paymentMethod === "PROMPTPAY" ? "PromptPay" : "เก็บเงินปลายทาง"}</strong>
              </div>
              <div className="order-detail-info">
                <span>สถานะการชำระเงิน</span>
                <strong className={paymentStatus === "PAID" ? "payment-paid" : "payment-unpaid"}>
                  {paymentStatus === "PAID" ? "สำเร็จ" : "ยังไม่ชำระ"}
                </strong>
              </div>
            </div>
            {canPay && (
              <button className="btn-place" onClick={handlePayment}>
                ไปชำระเงิน
              </button>
            )}
            {slipUrl && (
              <div className="order-proof-block">
                <span>สลิปการชำระเงิน</span>
                <a href={slipUrl} target="_blank" rel="noreferrer">
                  <img src={slipUrl} alt="สลิปการชำระเงิน" />
                </a>
              </div>
            )}
          </section>

          {deliveryProofUrl && (
            <section className="order-detail-section">
              <h3>หลักฐานการจัดส่งจากร้านค้า</h3>
              <div className="order-proof-block">
                <a href={deliveryProofUrl} target="_blank" rel="noreferrer">
                  <img src={deliveryProofUrl} alt="หลักฐานการจัดส่งจากร้านค้า" />
                </a>
                <span>กดที่รูปเพื่อดูภาพขนาดเต็ม</span>
              </div>
            </section>
          )}

          <footer className="order-detail-actions">
            {order.order_status === "PENDING" && !slipFilename && (
              <button className="btn-back" onClick={cancelOrder}>ยกเลิกคำสั่งซื้อ</button>
            )}
            <button className="btn-place" onClick={() => navigate("/order-history")}>
              กลับไปประวัติคำสั่งซื้อ
            </button>
          </footer>
        </article>
      </div>
    </div>
  );
}

export default OrderDetail;
