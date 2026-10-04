import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { checkoutOrder, getCart } from "../../api/cart.api";
import "./Checkout.css";

function getSavedProfile() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch (error) {
    console.error("localStorage profile parse error:", error);
    return null;
  }
}

function Checkout() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [name, setName] = useState(() => {
    const profile = getSavedProfile();
    return profile?.username || profile?.name || "";
  });
  const [phone, setPhone] = useState(() => getSavedProfile()?.phone || "");
  const [address, setAddress] = useState(() => getSavedProfile()?.address || "");
  const [addressDetails, setAddressDetails] = useState("");
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [payment, setPayment] = useState("promptpay");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadCart = async () => {
      try {
        const result = await getCart();
        const items = result.data?.items || [];
        setCart(items.map((item) => ({
          ...item,
          name: item.product_name || item.name || "ไม่ระบุชื่อสินค้า",
        })));
      } catch (requestError) {
        if (requestError.response?.status !== 404) {
          setError(requestError.response?.data?.message || "ไม่สามารถโหลดตะกร้าได้");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  function calcTotal(items) {
    return items.reduce((s, it) => s + (it.price || 0) * (it.quantity || it.qty || 1), 0);
  }

  async function placeOrder() {
    const deliveryAddress = [address.trim(), addressDetails.trim()]
      .filter(Boolean)
      .join(" ");

    if (!name || !phone || !deliveryAddress) {
      alert("กรุณากรอกชื่อ, เบอร์โทรศัพท์ และที่อยู่จัดส่ง");
      return;
    }

    if (!cart || !cart.length) {
      alert("ตะกร้าว่าง");
      return;
    }

    try {
      setSubmitting(true);
      const result = await checkoutOrder({
        receiver_name: name,
        receiver_phone: phone,
        delivery_address: deliveryAddress,
        payment_method: payment === "promptpay" ? "PROMPTPAY" : "COD",
      });

      setCart([]);
      localStorage.removeItem("medicalapp_cart");

      if (payment === "promptpay") {
        localStorage.setItem(
          "pending_payment",
          JSON.stringify({
            order: result.data,
            cart,
          })
        );
        navigate("/payment");
      } else {
        alert("สั่งซื้อเรียบร้อยแล้ว");
        navigate("/order-history", { state: { order: result.data } });
      }
    } catch (requestError) {
      console.error("Checkout error:", requestError);
      setError(requestError.response?.data?.message || "ไม่สามารถสั่งซื้อได้");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <div className="checkout-page"><div className="checkout-container">กำลังโหลดตะกร้า...</div></div>;
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationError("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const coordinateAddress = `ตำแหน่งปัจจุบัน: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
          );
          if (!response.ok) throw new Error("Reverse geocoding failed");
          const data = await response.json();
          setAddress(data.display_name || coordinateAddress);
        } catch (requestError) {
          console.error("Reverse geocoding error:", requestError);
          setAddress(coordinateAddress);
          setLocationError("ค้นหาที่อยู่จากพิกัดไม่ได้ สามารถแก้ไขที่อยู่ด้วยตนเองได้");
        } finally {
          setLocationLoading(false);
        }
      },
      (err) => {
        console.error("Get delivery location error:", err);
        setLocationError("ไม่สามารถรับตำแหน่งได้ โปรดอนุญาต Location หรือกรอกที่อยู่ด้วยตนเอง");
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-container">
          <div className="cart-header">
            <Link to="/shop" className="cart-back">
              <FaArrowLeft />
            </Link>
            <h1 style={{margin:0}}>ยืนยันการสั่งซื้อ</h1>
          </div>

        <section className="checkout-section">
          <h2>รายการสินค้า</h2>
          {cart.length ? (
            <div className="checkout-items">
              {cart.map((it, i) => (
                <div className="checkout-item" key={i}>
                  <div className="ci-left">
                    <div className="ci-name">{it.name}</div>
                    <div className="ci-meta">จำนวน: {it.quantity || it.qty || 1}</div>
                  </div>
                  <div className="ci-right">{(it.price || 0) * (it.quantity || it.qty || 1)} บาท</div>
                </div>
              ))}
              <div className="checkout-total">รวมทั้งหมด: {calcTotal(cart)} บาท</div>
            </div>
          ) : (
            <div>ตะกร้าว่าง</div>
          )}
        </section>

        <section className="checkout-section">
          <h2>ข้อมูลผู้รับ / ที่อยู่</h2>
          <div className="field"><label>ชื่อผู้รับ</label><input value={name} onChange={(e)=>setName(e.target.value)} /></div>
          <div className="field"><label>เบอร์โทรศัพท์</label><input value={phone} onChange={(e)=>setPhone(e.target.value)} /></div>
          <div className="field">
            <label htmlFor="delivery-address">ที่อยู่จัดส่ง</label>
            <button
              type="button"
              className="btn-use-location"
              onClick={useCurrentLocation}
              disabled={locationLoading}
            >
              {locationLoading ? "กำลังค้นหาตำแหน่ง..." : "ใช้ตำแหน่งปัจจุบัน"}
            </button>
            <textarea
              id="delivery-address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ที่อยู่หลัก เช่น บ้านเลขที่ ถนน แขวง/ตำบล เขต/อำเภอ จังหวัด"
              required
            />
            <label htmlFor="delivery-address-details">รายละเอียดเพิ่มเติม (ไม่บังคับ)</label>
            <textarea
              id="delivery-address-details"
              className="address-details"
              value={addressDetails}
              onChange={(e) => setAddressDetails(e.target.value)}
              placeholder="อาคาร ชั้น ห้อง หมู่บ้าน ซอย จุดสังเกต หรือคำแนะนำให้ผู้จัดส่ง"
            />
            {locationError && <p className="checkout-location-error">{locationError}</p>}
          </div>
          <div className="field"><label>วิธีชำระเงิน</label>
            <select value={payment} onChange={(e)=>setPayment(e.target.value)}>
              <option value="promptpay">PromptPay</option>
              <option value="cod">เก็บเงินปลายทาง</option>
            </select>
          </div>
        </section>

        <div className="checkout-actions">
          {error && <p className="checkout-error">{error}</p>}
          <button className="btn-place" onClick={placeOrder} disabled={!cart.length || submitting}>
            {submitting ? "กำลังสั่งซื้อ..." : "ยืนยันสั่งซื้อ"}
          </button>
        </div>
      </div>

      
    </div>
  );
}

export default Checkout;
