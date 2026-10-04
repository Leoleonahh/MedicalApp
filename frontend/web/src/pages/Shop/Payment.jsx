import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { getOrderQRCode, uploadPaymentSlip } from "../../api/cart.api";
import "./Checkout.css";

function Payment() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [processing, setProcessing] = useState(false);
  const runningRef = useRef(false);
  const [slipPreview, setSlipPreview] = useState(null);
  const [slipName, setSlipName] = useState(null);
  const [qrCode, setQrCode] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState("");
  const [slipLoading, setSlipLoading] = useState(false);
  const [slipError, setSlipError] = useState("");
  const [slipVerified, setSlipVerified] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("pending_payment");
      if (!raw) return;
      setPending(JSON.parse(raw));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    // If pending already has slip (in case user re-opens), load it
    if (pending && pending.order && pending.order.slip) {
      setSlipPreview(pending.order.slip);
      setSlipName(pending.order.slipName || null);
    }
  }, [pending]);

  useEffect(() => {
    const loadQRCode = async () => {
      if (!pending?.order?.order_id) {
        setQrError("ไม่พบหมายเลขคำสั่งซื้อสำหรับสร้าง QR Code");
        return;
      }

      try {
        setQrLoading(true);
        const response = await getOrderQRCode(pending.order.order_id);
        setQrCode(response.qr || response.data?.qr || "");
      } catch (requestError) {
        console.error("Load PromptPay QR error:", requestError);
        setQrError(
          requestError.response?.data?.message ||
          "ไม่สามารถสร้าง QR Code ได้"
        );
      } finally {
        setQrLoading(false);
      }
    };

    if (pending) {
      loadQRCode();
    }
  }, [pending]);

  function finalizePayment() {
    if (!pending || !slipVerified) return;
    if (runningRef.current) return;
    runningRef.current = true;
    setProcessing(true);
    try {
      const order = pending.order;
      if (!order.date) {
        order.date = new Date().toLocaleString("th-TH", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
      }
      const cart = pending.cart || [];
      const newOrder = { ...order, slip: slipPreview || order.slip || null, slipName: slipName || order.slipName || null };

      // save to medicalapp_orders
      const savedRaw = localStorage.getItem("medicalapp_orders");
      const saved = savedRaw ? JSON.parse(savedRaw) : [];
      saved.unshift(newOrder);
      localStorage.setItem("medicalapp_orders", JSON.stringify(saved));

      // create per-shop orders
      const byShop = {};
      cart.forEach((it) => {
        const sid = it.shopId || "unknown";
        if (!byShop[sid]) byShop[sid] = [];
        byShop[sid].push(it);
      });
      Object.keys(byShop).forEach((sid) => {
        const shopOrdersRaw = localStorage.getItem("shop_orders");
        const shopOrders = shopOrdersRaw ? JSON.parse(shopOrdersRaw) : [];
        const shopOrder = {
          id: `${order.id}_${sid}`,
          code: order.code,
          recipient: order.recipient,
          phone: order.phone,
          address: order.address,
          payment: order.payment,
          total: byShop[sid].reduce((s, it) => s + (it.price || 0) * (it.quantity || it.qty || 1), 0),
          status: "รอจัดส่ง",
          items: byShop[sid],
          slip: slipPreview || order.slip || null,
          slipName: slipName || order.slipName || null,
        };
        shopOrders.unshift(shopOrder);
        try {
          localStorage.setItem("shop_orders", JSON.stringify(shopOrders));
        } catch (e) {
          console.error('Failed to save shop_orders', e);
        }
      });

      // clear pending and cart
      localStorage.removeItem("pending_payment");
      localStorage.removeItem("medicalapp_cart");

      setProcessing(false);
      runningRef.current = false;
      alert("ชำระเงินเรียบร้อยและสั่งซื้อเรียบร้อยแล้ว");
      navigate("/order-history");
    } catch (e) {
      console.error(e);
      setProcessing(false);
      runningRef.current = false;
      alert("เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ");
    }
  }

  if (!pending) {
    return (
      <div className="checkout-page">
        <div className="checkout-container">
          <h2>ไม่มีรายการชำระเงินรอดำเนินการ</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="cart-header">
          <Link to="/shop" className="cart-back">
            <FaArrowLeft />
          </Link>
          <h1 style={{margin:0}}>ชำระเงิน (PromptPay)</h1>
        </div>

        <section className="checkout-section">
          <h2>สรุปรายการ</h2>
          <div className="checkout-items">
            {(pending.cart || []).map((it, i) => (
              <div className="checkout-item" key={i}>
                <div className="ci-left">
                  <div className="ci-name">{it.product_name || it.name || "ไม่ระบุชื่อสินค้า"}</div>
                  <div className="ci-meta">จำนวน: {it.quantity || it.qty || 1}</div>
                </div>
                <div className="ci-right">{(it.price || 0) * (it.quantity || it.qty || 1)} บาท</div>
              </div>
            ))}
            <div className="checkout-total">รวมทั้งหมด: {pending.order.grand_total ?? pending.order.total ?? 0} บาท</div>
          </div>
        </section>

        <section className="checkout-section">
          <h2>คำแนะนำการชำระ</h2>
          <p>สแกน QR PromptPay หรือชำระด้วยวิธีที่คุณต้องการ แล้วกด "ชำระเงินเรียบร้อย" เพื่อยืนยัน</p>
          <div style={{marginTop:12}}>
            {qrLoading && <p>กำลังสร้าง QR Code...</p>}
            {qrError && <p className="checkout-error">{qrError}</p>}
            {qrCode && (
              <img
                src={qrCode}
                alt="QR Code สำหรับชำระเงิน"
                style={{width:200, height:200, objectFit:"contain", borderRadius:8, border:"1px solid var(--border)"}}
              />
            )}
          </div>
          <div style={{marginTop:12}}>
            <label style={{display:'block',marginBottom:8}}>แนบสลิปการโอน (รูปภาพ)</label>
            <input type="file" accept="image/*" onChange={async (e) => {
              const f = e.target.files && e.target.files[0];
              if (!f) return;
              setSlipError("");
              setSlipVerified(false);
              setSlipName(f.name);
              const reader = new FileReader();
              reader.onload = function(ev) {
                setSlipPreview(ev.target.result);
              }
              reader.readAsDataURL(f);

              try {
                setSlipLoading(true);
                const response = await uploadPaymentSlip(pending.order.order_id, f);
                const match = response.data?.ocr?.match === true;

                if (!match) {
                  setSlipError("ตรวจสอบสลิปไม่ผ่าน ยอดเงินไม่ตรงกับคำสั่งซื้อ");
                  return;
                }

                setSlipVerified(true);
              } catch (requestError) {
                console.error("Upload payment slip error:", requestError);
                setSlipError(
                  requestError.response?.data?.message ||
                  "ไม่สามารถตรวจสอบสลิปได้"
                );
              } finally {
                setSlipLoading(false);
              }
            }} />
            {slipLoading && <p>กำลังอัปโหลดและตรวจสอบสลิป...</p>}
            {slipVerified && <p className="checkout-success">ตรวจสอบสลิปผ่านแล้ว</p>}
            {slipError && <p className="checkout-error">{slipError}</p>}
            {slipPreview && (
              <div style={{marginTop:8}} className="slip-preview">
                <img src={slipPreview} alt="slip" style={{maxWidth:220, maxHeight:220, borderRadius:8, border:'1px solid var(--border)'}} />
                <div style={{marginTop:6}}>
                  <button className="btn-back" onClick={() => { setSlipPreview(null); setSlipName(null); }}>ลบสลิป</button>
                </div>
              </div>
            )}
          </div>
        </section>

        <div className="checkout-actions" style={{marginTop:12}}>
          <button
            className="btn-place"
            onClick={finalizePayment}
            disabled={processing || slipLoading || !slipVerified}
          >
            {processing ? "กำลังดำเนินการ..." : "ชำระเงินเรียบร้อย"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Payment;
