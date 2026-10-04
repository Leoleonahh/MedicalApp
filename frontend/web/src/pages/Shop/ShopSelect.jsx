import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getMyVerifiedPharmacies } from "../../api/pharmacy.api";
import "./ShopSelect.css";

function ShopSelect() {
  const navigate = useNavigate();
  const [shops, setShops] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShops = async () => {
      try {
        const result = await getMyVerifiedPharmacies();
        setShops(result.data || []);
      } catch (err) {
        console.error("Load verified shops error:", err);
        setError(err.response?.data?.message || "ไม่สามารถโหลดร้านค้าได้");
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
      <div className="shop-header">
        <Link to="/profile" className="shop-back"><FaArrowLeft /></Link>
        <div className="shop-title">เลือกร้านที่คุณจัดการ</div>
      </div>

      <div className="shop-select-card">
        <div className="shop-grid">
          {error && <p className="shop-error">{error}</p>}

          {!error && shops.length === 0 && (
            <p className="shop-empty">ยังไม่มีร้านค้าที่ผ่านการยืนยัน</p>
          )}

          {shops.map((s) => (
            <div className="shop-card-item" key={s.pharmacy_id}>
              <div className="shop-name">{s.pharmacy_name}</div>
              <div className="shop-meta">{s.email}</div>
              <div className="shop-meta">{s.phone}</div>
              <div className="shop-actions">
                <button className="shop-manage" onClick={() => handleManage(s)}>จัดการร้านนี้</button>
              </div>
            </div>
          ))}
        </div>

        <div className="shop-controls">
          <Link to="/shop/create" className="shop-create">สร้างร้านค้าใหม่</Link>
        </div>
      </div>
    </div>
  );
}

export default ShopSelect;
