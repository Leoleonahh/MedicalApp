import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./ShopOrderDetail.css";

function ShopOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        const response = await api.get(`/orders/pharmacy/orders/${id}`);
        const data = response.data?.data;
        const backendOrder = data?.order;

        if (!backendOrder) {
          setOrder(null);
          return;
        }

        const mappedOrder = {
          ...backendOrder,
          id: backendOrder.order_id,
          code: `ออเดอร์${String(backendOrder.order_id).padStart(3, "0")}`,
          payment: backendOrder.payment_method,
          recipient: backendOrder.receiver_name,
          phone: backendOrder.receiver_phone,
          address: backendOrder.delivery_address,
          total: backendOrder.grand_total,
          status: backendOrder.order_status,
          items: (data.items || []).map((item) => ({
            name: item.product_name,
            qty: item.quantity,
            price: item.unit_price,
          })),
        };

        setOrder(mappedOrder);
        const saved = JSON.parse(localStorage.getItem("shop_orders") || "[]");
        const next = saved.map((savedOrder) =>
          String(savedOrder.id) === String(mappedOrder.id)
            ? mappedOrder
            : savedOrder
        );
        localStorage.setItem("shop_orders", JSON.stringify(next));
      } catch (error) {
        console.error("Failed to load pharmacy order detail", error);
        setOrder(null);
      }
    };

    loadOrder();
  }, [id]);

  async function updateStatus(orderStatus) {
    if (!order) return;

    try {
      const response = await api.put(`/orders/${order.id}/status`, {
        order_status: orderStatus,
      });
      const updatedStatus = response.data?.data?.order_status || orderStatus;
      setOrder((current) => ({ ...current, status: updatedStatus }));
    } catch (error) {
      console.error("Failed to update pharmacy order status", error);
      alert(error.response?.data?.message || "ไม่สามารถอัปเดตสถานะ order ได้");
    }
  }

  async function handleCancel() {
    if (!order) return;
    if (!confirm("ยืนยันการยกเลิกออเดอร์นี้หรือไม่?")) return;
    await updateStatus("CANCELLED");
  }

  if (!order) {
    return (
      <div className="orders-page">
        <div className="left-accent" />
        <div className="orders-container">
          <header className="orders-header">
            <Link to="/shop/orders" className="manage-back">
              <FaArrowLeft />
            </Link>
            <h1 className="orders-title">รายละเอียดออเดอร์</h1>
          </header>
          <div className="orders-list">
            <div className="order-card">ไม่พบออเดอร์</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page">
      <div className="left-accent" />

      <div className="orders-container">
        <header className="orders-header">
          <button onClick={() => navigate(-1)} className="manage-back">
            <FaArrowLeft />
          </button>
          <h1 className="orders-title">{order.code}</h1>
        </header>

        <div className="order-detail-card">
                <div className="detail-row">
                  <div className="detail-label">สินค้า</div>
                  <div className="detail-value">
                    <div className="items-list">
                      {order.items && order.items.length ? (
                        order.items.map((it, i) => (
                          <div className="item-row" key={i}>
                            <div className="item-name">{it.name}</div>
                            <div className="item-qty">x{it.qty}</div>
                            <div className="item-price">{it.price} บาท</div>
                          </div>
                        ))
                      ) : (
                        <div>ไม่มีสินค้า</div>
                      )}
                    </div>
                  </div>
                </div>

          <div className="detail-row">
            <div className="detail-label">ชื่อผู้รับ</div>
            <div className="detail-value">{order.recipient}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">เบอร์โทรศัพท์</div>
            <div className="detail-value">{order.phone}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">ที่อยู่จัดส่ง</div>
            <div className="detail-value">{order.address}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">วิธีการชำระเงิน</div>
            <div className="detail-value">{order.payment === "PROMPTPAY" ? "PromptPay" : "เก็บเงินปลายทาง"}</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">ราคารวมสินค้า</div>
            <div className="detail-value">{order.total} บาท</div>
          </div>

          <div className="detail-row">
            <div className="detail-label">สถานะการจัดส่ง</div>
            <div className="detail-value">
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="status-select"
              >
                <option value="PENDING">รอจัดส่ง</option>
                <option value="PREPARING">กำลังเตรียมสินค้า</option>
                <option value="SHIPPING">กำลังจัดส่ง</option>
                <option value="DELIVERED">จัดส่งแล้ว</option>
                <option value="CANCELLED">ยกเลิก</option>
              </select>
            </div>
          </div>

          <div className="detail-actions">
            <button
              className="btn btn-cancel"
              onClick={handleCancel}
              disabled={order.status === "CANCELLED"}
            >
              ยกเลิก order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopOrderDetail;
