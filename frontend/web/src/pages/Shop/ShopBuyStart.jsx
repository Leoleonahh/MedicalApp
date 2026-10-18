import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllVerifiedPharmacies } from "../../api/pharmacy.api";
import { FaArrowLeft } from "react-icons/fa";
import "./ShopBuyStart.css";

const MAX_DELIVERY_DISTANCE_KM = 5;

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง"));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude }),
      (error) => reject(new Error(
        error.code === error.PERMISSION_DENIED
          ? "กรุณาอนุญาตการเข้าถึงตำแหน่งเพื่อหาร้านขายยาในระยะจัดส่ง"
          : "ไม่สามารถระบุตำแหน่งปัจจุบันได้ กรุณาลองใหม่อีกครั้ง"
      )),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

function distanceInKilometers(firstLatitude, firstLongitude, secondLatitude, secondLongitude) {
  if ([firstLatitude, firstLongitude, secondLatitude, secondLongitude].some((value) => value == null)) {
    return null;
  }

  const coordinates = [firstLatitude, firstLongitude, secondLatitude, secondLongitude].map(Number);
  if (!coordinates.every(Number.isFinite)) return null;

  const [latitudeA, longitudeA, latitudeB, longitudeB] = coordinates;
  const earthRadius = 6371;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latitudeDifference = toRadians(latitudeB - latitudeA);
  const longitudeDifference = toRadians(longitudeB - longitudeA);
  const haversine =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(latitudeA)) *
      Math.cos(toRadians(latitudeB)) *
      Math.sin(longitudeDifference / 2) ** 2;

  return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function ShopBuyStart() {
  const [shops, setShops] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [distanceLabel, setDistanceLabel] = useState("ตำแหน่งปัจจุบัน");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showDistances = searchParams.get("source") === "result";
  const woundLatitude = searchParams.get("latitude");
  const woundLongitude = searchParams.get("longitude");

  useEffect(() => {
    let cancelled = false;

    const loadShops = async () => {
      setLoading(true);
      setError("");
      try {
        const hasWoundCoordinates =
          woundLatitude != null && woundLongitude != null &&
          Number.isFinite(Number(woundLatitude)) && Number.isFinite(Number(woundLongitude));
        const origin = showDistances && hasWoundCoordinates
          ? { latitude: Number(woundLatitude), longitude: Number(woundLongitude) }
          : await getCurrentPosition();
        const originLabel = showDistances && hasWoundCoordinates
          ? "ตำแหน่งบาดแผล"
          : "ตำแหน่งปัจจุบัน";
        const result = await getAllVerifiedPharmacies();
        const verifiedShops = result.data || [];
        const nearbyShops = verifiedShops
          .map((shop) => ({
            ...shop,
            distance: distanceInKilometers(origin.latitude, origin.longitude, shop.latitude, shop.longitude),
          }))
          .filter((shop) => shop.distance != null && shop.distance <= MAX_DELIVERY_DISTANCE_KM)
          .sort((firstShop, secondShop) => firstShop.distance - secondShop.distance);

        if (!cancelled) {
          setDistanceLabel(originLabel);
          setShops(showDistances ? nearbyShops.slice(0, 3) : nearbyShops);
        }
      } catch (err) {
        console.error("Load verified shops error:", err);
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || "ไม่สามารถโหลดร้านค้าได้");
          setShops([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadShops();
    return () => { cancelled = true; };
  }, [showDistances, woundLatitude, woundLongitude]);

  function selectShop(s) {
    localStorage.setItem("selected_shop", JSON.stringify(s));
    const query = searchParams.toString();
    navigate(query ? `/shop?${query}` : "/shop");
  }

  return (
    <div className="buy-start-page">
      <div className="left-accent" />
      <div className="buy-container">
        <button
          type="button"
          className="shop-back-btn"
          onClick={() => navigate("/home")}
          aria-label="กลับไปหน้า home"
        >
          <FaArrowLeft />
          <span>กลับ</span>
        </button>

        <header className="buy-header">
          <h1 className="buy-title">เลือกร้านก่อนซื้อ</h1>
          <p className="buy-sub">เลือกจากร้านค้าที่ต้องการสั่งซื้อสินค้าปฐมพยาบาล</p>
          <p className="buy-sub">แสดงร้านที่อยู่ไม่เกิน {MAX_DELIVERY_DISTANCE_KM} กม. จาก{distanceLabel}</p>
        </header>

        <div className="shop-list">
          {error && <p className="shop-empty">{error}</p>}
          {loading && <p className="shop-empty">กำลังค้นหาร้านขายยาในระยะจัดส่ง...</p>}
          {!loading && !error && shops.length === 0 && (
            <p className="shop-empty">ไม่พบร้านขายยาที่อยู่ภายในระยะ {MAX_DELIVERY_DISTANCE_KM} กม.</p>
          )}

          {shops.map((s) => (
            <div key={s.pharmacy_id} className="shop-card">
              <div className="shop-info">
                <div className="shop-name">{s.pharmacy_name}</div>
                <div className="shop-meta">{s.phone} · {s.email}</div>
                <div className="shop-meta">ห่างจาก{distanceLabel} {s.distance.toFixed(2)} กม.</div>
              </div>
              <div className="shop-actions">
                <button className="btn-select" onClick={() => selectShop(s)}>เลือกร้านนี้</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ShopBuyStart;
