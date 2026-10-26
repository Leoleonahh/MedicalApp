import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import api from "../../api/axios";
import "./ShopOrderDetail.css";

const API_URL = import.meta.env.VITE_API_URL;
const allowedStatusTransitions = {
  PENDING: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPING", "CANCELLED"],
  SHIPPING: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
};
const skipStatusMessage =
  "ห้ามข้ามขั้นตอน กรุณาเปลี่ยนสถานะตามลำดับ: รอจัดส่ง → กำลังเตรียมสินค้า → กำลังจัดส่ง → จัดส่งแล้ว";

function ShopOrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [deliveryProof, setDeliveryProof] = useState(null);
  const [deliveryProofPreview, setDeliveryProofPreview] = useState("");
  const [statusError, setStatusError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!deliveryProof) {
      setDeliveryProofPreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(deliveryProof);
    setDeliveryProofPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [deliveryProof]);

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

    if (!allowedStatusTransitions[order.status]?.includes(orderStatus)) {
      alert(skipStatusMessage);
      return;
    }

    if (orderStatus === "DELIVERED" && !deliveryProof) {
      alert("กรุณาแนบรูปหลักฐานการจัดส่งก่อนยืนยันสถานะจัดส่งแล้ว");
      setStatusError("");
      return;
    }

    try {
      setUpdatingStatus(true);
      setStatusError("");
      const formData = new FormData();
      formData.append("order_status", orderStatus);
      if (orderStatus === "DELIVERED" && deliveryProof) {
        formData.append("delivery_proof", deliveryProof);
      }
      const response = await api.put(
        `/orders/${order.id}/status`,
        formData,
        { headers: { "Content-Type": undefined } }
      );
      const updatedStatus = response.data?.data?.order_status || orderStatus;
      setOrder((current) => ({
        ...current,
        status: updatedStatus,
        delivery_proof:
          response.data?.data?.delivery_proof || current.delivery_proof,
      }));
      setDeliveryProof(null);
    } catch (error) {
      console.error("Failed to update pharmacy order status", error);
      const message = error.response?.data?.message || "ไม่สามารถอัปเดตสถานะ order ได้";
      if (message.startsWith("Cannot change status from")) {
        alert(skipStatusMessage);
        setStatusError("");
      } else {
        setStatusError(message);
      }
    } finally {
      setUpdatingStatus(false);
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

          {order.status === "SHIPPING" && (
            <div className="detail-row">
              <div className="detail-label">หลักฐานการจัดส่ง</div>
              <div className="detail-value delivery-proof-upload">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    setDeliveryProof(event.target.files?.[0] || null);
                    setStatusError("");
                  }}
                />
                <span>แนบรูปก่อนเลือกสถานะ “จัดส่งแล้ว” (ไม่เกิน 5 MB)</span>
                {deliveryProofPreview && (
                  <img
                    className="delivery-proof-preview"
                    src={deliveryProofPreview}
                    alt="ตัวอย่างรูปหลักฐานการจัดส่ง"
                  />
                )}
              </div>
            </div>
          )}

          {order.delivery_proof && (
            <div className="detail-row">
              <div className="detail-label">หลักฐานการจัดส่ง</div>
              <div className="detail-value">
                <a
                  href={`${API_URL}/uploads/delivery-proofs/${encodeURIComponent(order.delivery_proof)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    className="delivery-proof-image"
                    src={`${API_URL}/uploads/delivery-proofs/${encodeURIComponent(order.delivery_proof)}`}
                    alt="หลักฐานการจัดส่ง"
                  />
                </a>
              </div>
            </div>
          )}

          <div className="detail-row">
            <div className="detail-label">สถานะการจัดส่ง</div>
            <div className="detail-value">
              <select
                value={order.status}
                onChange={(e) => updateStatus(e.target.value)}
                className="status-select"
                disabled={updatingStatus}
              >
                <option value="PENDING">รอจัดส่ง</option>
                <option value="PREPARING">กำลังเตรียมสินค้า</option>
                <option value="SHIPPING">กำลังจัดส่ง</option>
                <option value="DELIVERED">จัดส่งแล้ว</option>
              </select>
            </div>
          </div>

          {statusError && <p className="status-error">{statusError}</p>}

          <div className="detail-actions">
              {order.status === "PENDING" && (
                <button
                  className="btn btn-cancel"
                  onClick={handleCancel}
                >
                  ยกเลิก order
                </button>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ShopOrderDetail;
