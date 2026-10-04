import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getPharmacyDetail, updatePromptPay } from "../../api/pharmacy.api";
import "./ShopEdit.css";

function ShopEdit() {
  const navigate = useNavigate();
  const [promptpay, setPromptpay] = useState("");
  const [pharmacyId, setPharmacyId] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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

        setPharmacyId(selectedShop.pharmacy_id);
        setPromptpay(selectedShop.promptpay_number || "");

        const result = await getPharmacyDetail(selectedShop.pharmacy_id);
        const shop = result.data || result.shop;
        setPromptpay(shop?.promptpay_number || "");
      } catch (err) {
        console.error("Load shop for edit error:", err);
        setError(err.response?.data?.message || "ไม่สามารถโหลดข้อมูลร้านค้าได้");
      }
    };

    if (localStorage.getItem("token")) {
      loadShop();
    } else {
      setError("กรุณาเข้าสู่ระบบก่อน");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!pharmacyId) {
      setError("ไม่พบร้านค้าที่เลือก");
      return;
    }

    try {
      setLoading(true);
      await updatePromptPay(pharmacyId, promptpay);
      alert("บันทึก PromptPay เรียบร้อย");
      navigate("/shop/profile");
    } catch (err) {
      console.error("Update PromptPay error:", err);
      setError(err.response?.data?.message || "ไม่สามารถบันทึก PromptPay ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shop-edit-page">
      <div className="shop-header">
        <Link to="/shop/profile" className="shop-back"><FaArrowLeft /></Link>
        <div className="shop-title">แก้ไข PromptPay</div>
      </div>

      <div className="shop-card">
        <form className="shop-edit-form" onSubmit={handleSubmit}>
          <label className="shop-label">PromptPay</label>
          <input value={promptpay} onChange={(e) => setPromptpay(e.target.value)} placeholder="เลข PromptPay" required />

          {error && <p className="shop-error">{error}</p>}

          <div className="shop-actions">
            <Link to="/shop/profile" className="shop-cancel">ยกเลิก</Link>
            <button className="shop-save" type="submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ShopEdit;
