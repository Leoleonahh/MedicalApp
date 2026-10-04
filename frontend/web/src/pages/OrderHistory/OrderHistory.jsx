import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { getMyOrders } from "../../api/cart.api";
import "./OrderHistory.css";

function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOrders = async () => {
      try {
        const result = await getMyOrders();
        setOrders(result.data || []);
      } catch (requestError) {
        console.error("Load order history error:", requestError);
        setError(requestError.response?.data?.message || "ไม่สามารถโหลดประวัติคำสั่งซื้อได้");
      } finally {
        setLoading(false);
      }
    };

    loadOrders();
  }, []);

  const orderCards = orders.map((order) => {
    const items = order.items || [];
    const displayDate = order.created_at
      ? new Date(order.created_at).toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
      : "";
    return (
      <Link to={`/order/${order.order_id}`} key={order.order_id} className="order-card-link">
        <div className="order-card">
          <div className="order-card-top">
            <div>
              <p className="order-date">{displayDate}</p>
              <p className="order-shop">ร้าน: {order.pharmacy_name || "ไม่ระบุร้าน"}</p>
              <h2>ยอดรวม ฿{order.grand_total}</h2>
            </div>
            <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:8}}>
              <span className="order-count">{items.length} รายการ</span>
              <span style={{fontWeight:700, color: order.order_status === 'CANCELLED' ? '#d00' : 'inherit'}}>{order.order_status}</span>
            </div>
          </div>
          <div className="order-items">
            {items.map((item) => (
              <div className="order-item" key={item.order_item_id}>
                <p>{item.product_name}</p>
                <span>฿{item.unit_price} x {item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      </Link>
    );
  });

  return (
    <div className="order-history-page">
      <div className="order-history-top">
        <Link to="/shop" className="order-history-back">
          <FaArrowLeft />
        </Link>
        <div>
          <p className="order-history-subtitle">ประวัติคำสั่งซื้อ</p>
          <h1>รายการคำสั่งซื้อ</h1>
        </div>
      </div>

      {loading ? (
        <div className="order-history-empty"><p>กำลังโหลดประวัติคำสั่งซื้อ...</p></div>
      ) : error ? (
        <div className="order-history-empty"><p>{error}</p></div>
      ) : orders.length === 0 ? (
        <div className="order-history-empty">
          <p>ยังไม่มีคำสั่งซื้อ</p>
          <Link to="/shop" className="btn btn-secondary">
            กลับไปหน้าช้อป
          </Link>
        </div>
      ) : (
        <div className="order-history-list">
          {orderCards}
        </div>
      )}
    </div>
  );
}

export default OrderHistory;
