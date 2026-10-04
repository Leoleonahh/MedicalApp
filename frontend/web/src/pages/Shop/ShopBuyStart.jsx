import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { getAllVerifiedPharmacies } from "../../api/pharmacy.api";
import { FaArrowLeft } from "react-icons/fa";
import "./ShopBuyStart.css";

function ShopBuyStart() {
  const [shops, setShops] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const distanceInKilometers = (latitude, longitude) => {
    const woundLatitude = Number(searchParams.get("latitude"));
    const woundLongitude = Number(searchParams.get("longitude"));
    const shopLatitude = Number(latitude);
    const shopLongitude = Number(longitude);

    if (
      !Number.isFinite(woundLatitude) ||
      !Number.isFinite(woundLongitude) ||
      !Number.isFinite(shopLatitude) ||
      !Number.isFinite(shopLongitude)
    ) {
      return null;
    }

    const earthRadius = 6371;
    const toRadians = (value) => (value * Math.PI) / 180;
    const latitudeDifference = toRadians(shopLatitude - woundLatitude);
    const longitudeDifference = toRadians(shopLongitude - woundLongitude);
    const haversine =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(toRadians(woundLatitude)) *
        Math.cos(toRadians(shopLatitude)) *
        Math.sin(longitudeDifference / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
  };

  useEffect(() => {
    const loadShops = async () => {
      try {
        const result = await getAllVerifiedPharmacies();
        const verifiedShops = result.data || [];
        setShops(
          verifiedShops
            .map((shop) => ({
              ...shop,
              distance: distanceInKilometers(shop.latitude, shop.longitude),
            }))
            .sort((firstShop, secondShop) => {
              if (firstShop.distance == null) return 1;
              if (secondShop.distance == null) return -1;
              return firstShop.distance - secondShop.distance;
            })
            .slice(0, 3)
        );
      } catch (err) {
        console.error("Load verified shops error:", err);
        setError(err.response?.data?.message || "ไม่สามารถโหลดร้านค้าได้");
      }
    };

    loadShops();
  }, []);

  function selectShop(s) {
    localStorage.setItem("selected_shop", JSON.stringify(s));

    navigate(`/shop`);
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
        </header>

        <div className="shop-list">
          {error && <p className="shop-empty">{error}</p>}
          {!error && shops.length === 0 && (
            <p className="shop-empty">ยังไม่มีร้านค้าที่ผ่านการยืนยัน</p>
          )}

          {shops.map((s) => (
            <div key={s.pharmacy_id} className="shop-card">
              <div className="shop-info">
                <div className="shop-name">{s.pharmacy_name}</div>
                <div className="shop-meta">{s.phone} · {s.email}</div>
                {s.distance != null && (
                  <div className="shop-meta">
                    ห่างจากตำแหน่งที่คุณอยู่ {s.distance.toFixed(2)} กม.
                  </div>
                )}
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
