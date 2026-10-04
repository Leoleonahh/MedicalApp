import { Link } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getPharmacyDetail } from "../../api/pharmacy.api";
import "./ShopProfile.css";

function ShopProfile() {
  const [shop, setShop] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadShop = async () => {
      try {
        const selectedShop = JSON.parse(
          localStorage.getItem("selected_shop") || "null"
        );

        if (!selectedShop?.pharmacy_id) {
          setError("ไม่พบร้านค้าที่เลือก");
          return;
        }

        const result = await getPharmacyDetail(selectedShop.pharmacy_id);
        setShop(result.data || result.shop);
      } catch (err) {
        console.error("Load shop profile error:", err);
        setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลร้านค้าได้");
      }
    };

    if (localStorage.getItem("token")) {
      loadShop();
    } else {
      setError("กรุณาเข้าสู่ระบบก่อน");
    }
  }, []);

  return (
    <div className="shop-profile-page">
      <div className="shop-header">
        <Link to="/shop/manage" className="shop-back"><FaArrowLeft /></Link>
        <div className="shop-title">ข้อมูลร้านค้า</div>
      </div>

      <div className="shop-card">
        <div className="shop-right full">
          {error ? (
            <div className="shop-row"><strong>{error}</strong></div>
          ) : shop ? (
            <>
              <div className="shop-row"><span className="label">ชื่อร้าน</span><strong>{shop.pharmacy_name || "-"}</strong></div>
              <div className="shop-row"><span className="label">อีเมล</span><strong>{shop.email || "-"}</strong></div>
              <div className="shop-row"><span className="label">เบอร์</span><strong>{shop.phone || "-"}</strong></div>
              <div className="shop-row"><span className="label">Promptpay</span><strong>{shop.promptpay_number || "-"}</strong></div>
            </>
          ) : (
            <div className="shop-row"><strong>กำลังโหลดข้อมูลร้านค้า...</strong></div>
          )}

          {shop && !error && (
            <div className="shop-actions">
              <Link to="/shop/edit" className="shop-edit">แก้ไขโปรไฟล์ร้านค้า</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ShopProfile;
