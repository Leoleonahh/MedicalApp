import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FaArrowRight, FaEnvelope, FaPhoneAlt, FaPlus, FaStore } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getMyVerifiedPharmacies } from "../../api/pharmacy.api";
import "./ShopSelect.css";

function ShopSelect() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShops = async () => {
      try {
        const result = await getMyVerifiedPharmacies();
        setShops(result.data || []);
      } catch (err) {
        console.error("Load verified shops error:", err);
        setError(err.response?.data?.message || "ไม่สามารถโหลดร้านค้าได้");
      } finally {
        setLoading(false);
      }
    };

    if (localStorage.getItem("token")) {
      loadShops();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleManage = (shop) => {
    localStorage.setItem("selected_shop", JSON.stringify(shop));
    navigate("/shop/manage");
  };

  return (
    <div className="shop-select-page">
      <header className="shop-select-header">
        <Link to="/profile" className="shop-select-back" aria-label="กลับหน้าโปรไฟล์">
          <FaArrowLeft />
        </Link>
        <div className="shop-select-heading">
          <span>SHOP MANAGEMENT</span>
          <h1>เลือกร้านที่คุณจัดการ</h1>
        </div>
        <Link to="/shop/create" className="shop-select-create">
          <FaPlus />
          <span>สร้างร้านค้า</span>
        </Link>
      </header>

      <main className="shop-select-main">
        <div className="shop-select-section-heading">
          <h2>ร้านค้าที่ผ่านการยืนยัน</h2>
          {!loading && !error && <span>{shops.length} ร้าน</span>}
        </div>

        {loading && <p className="shop-select-message">กำลังโหลดร้านค้า...</p>}
        {error && <p className="shop-select-message shop-select-error">{error}</p>}

        {!loading && !error && shops.length === 0 && (
          <div className="shop-select-empty">
            <FaStore />
            <h2>ยังไม่มีร้านที่พร้อมจัดการ</h2>
            <p>สร้างร้านค้าใหม่เพื่อเริ่มต้นจัดการสินค้าและคำสั่งซื้อ</p>
            <Link to="/shop/create" className="shop-select-empty-action">
              <FaPlus /> สร้างร้านค้าใหม่
            </Link>
          </div>
        )}

        {!loading && !error && shops.length > 0 && (
          <div className="shop-select-grid">
            {shops.map((shop) => (
              <article className="shop-select-item" key={shop.pharmacy_id}>
                <div className="shop-select-item-heading">
                  <span className="shop-select-icon"><FaStore /></span>
                  <span className="shop-select-id">ร้าน #{shop.pharmacy_id}</span>
                </div>
                <h3>{shop.pharmacy_name}</h3>
                <div className="shop-select-contact">
                  <span><FaEnvelope /> {shop.email || "ไม่ระบุอีเมล"}</span>
                  <span><FaPhoneAlt /> {shop.phone || "ไม่ระบุเบอร์โทร"}</span>
                </div>
                <button
                  className="shop-select-manage"
                  onClick={() => handleManage(shop)}
                >
                  <span>จัดการร้านนี้</span>
                  <FaArrowRight />
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default ShopSelect;
