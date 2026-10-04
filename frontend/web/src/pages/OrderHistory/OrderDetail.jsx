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
  const paymentStatus = String(order?.payment_status || "").toUpperCase();
  const paymentMethod = String(order?.payment_method || "").toUpperCase();
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
        <div className="order-detail-card">
          <p><strong>ร้านค้า:</strong> {order.pharmacy?.pharmacy_name || "-"}</p>
          <p><strong>สถานะ:</strong> <span style={{color: order.order_status === 'CANCELLED' ? '#d00' : 'inherit'}}>{order.order_status}</span></p>
          <p><strong>วันที่:</strong> {order.created_at ? new Date(order.created_at).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "-"}</p>
          <p><strong>ผู้รับ:</strong> {order.receiver_name}</p>
          <p><strong>เบอร์:</strong> {order.receiver_phone}</p>
          <p><strong>ที่อยู่:</strong> {order.delivery_address}</p>
          <p><strong>วิธีชำระเงิน:</strong> {order.payment_method}</p>
          <p>
            <strong>สถานะการชำระเงิน:</strong>{" "}
            <span style={{color: order.payment_status === "PAID" ? "#16803c" : "#c0395a"}}>
              {order.payment_status}
            </span>
          </p>
          {canPay && (
            <button className="btn-place" onClick={handlePayment}>
              ไปชำระเงิน
            </button>
          )}
          {slipUrl && (
            <div style={{marginTop:12}}>
              <p><strong>สลิปที่แนบ:</strong></p>
              <img src={slipUrl} alt="slip" style={{maxWidth:320,borderRadius:8,border:'1px solid var(--border)'}} />
            </div>
          )}

          <div style={{marginTop:12}}>
            <h3>รายการสินค้า</h3>
            {(order.items || []).map((it, i) => (
              <div key={i} style={{display:'flex',justifyContent:'space-between',padding:'6px 0'}}>
                <div>{it.product_name} x {it.quantity}</div>
                <div>{it.subtotal} บาท</div>
              </div>
            ))}
            <div style={{textAlign:'right',marginTop:8,fontWeight:700}}>รวม: {order.grand_total} บาท</div>
          </div>

          <div style={{marginTop:16,display:'flex',gap:8}}>
            {order.order_status === "PENDING" && !slipFilename && (
              <button className="btn-back" onClick={cancelOrder}>ยกเลิกคำสั่งซื้อ</button>
            )}
            <button className="btn-place" onClick={() => navigate('/order-history')}>กลับ</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetail;
