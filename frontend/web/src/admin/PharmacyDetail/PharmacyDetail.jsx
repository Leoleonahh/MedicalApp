import "./PharmacyDetail.css";
import { Link, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { getPharmacyDetail } from "../../api/pharmacy.api";

const API_URL = import.meta.env.VITE_API_URL;

function PharmacyDetail() {
  const { id } = useParams();
  const [pharmacy, setPharmacy] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPharmacy = async () => {
      try {
        const result = await getPharmacyDetail(id);
        setPharmacy(result.data || null);
      } catch (requestError) {
        console.error("Load pharmacy detail error:", requestError);
        setError(requestError.response?.data?.message || "ไม่สามารถโหลดรายละเอียดร้านได้");
      }
    };

    loadPharmacy();
  }, [id]);

  return (
    <div className="pharmacy-detail-page">
      <aside className="pharmacy-detail-sidebar">
        <div className="brand-box">
          <div className="brand-mark">M</div>
          <div><h2>MedicalApp</h2><span>Admin Panel</span></div>
        </div>
        <nav className="pharmacy-detail-nav">
          <Link to="/admin/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/admin/statistics" className="nav-item">สถิติระบบ</Link>
          <Link to="/admin/model-edit" className="nav-item">ข้อมูลโมเดล</Link>
          <Link to="/admin/pharmacies" className="nav-item active">ร้านขายยาที่ลงทะเบียน</Link>
          <Link to="/admin/pharmacy-approvals" className="nav-item">อนุมัติร้านยา</Link>
        </nav>
      </aside>
      <main className="pharmacy-detail-main">
        <Link to="/admin/pharmacies" className="detail-back"><FaArrowLeft /> กลับไปรายการร้าน</Link>
        {error ? <p className="detail-error">{error}</p> : pharmacy ? (
          <section className="detail-panel">
            <div className="detail-heading">
              <div><p>Pharmacy Details</p><h1>{pharmacy.pharmacy_name}</h1></div>
              <span className={`status-badge ${pharmacy.status === "verify" ? "verified" : "pending"}`}>
                {pharmacy.status === "verify" ? "เปิดใช้งาน" : "รออนุมัติ"}
              </span>
            </div>
            <div className="detail-grid">
              <div><span>เบอร์โทร</span><strong>{pharmacy.phone || "-"}</strong></div>
              <div><span>อีเมล</span><strong>{pharmacy.email || "-"}</strong></div>
              <div><span>PromptPay</span><strong>{pharmacy.promptpay_number || "-"}</strong></div>
              <div><span>วันที่ลงทะเบียน</span><strong>{pharmacy.created_at ? new Date(pharmacy.created_at).toLocaleDateString("th-TH") : "-"}</strong></div>
              <div><span>พิกัด</span><strong>{pharmacy.latitude || "-"}, {pharmacy.longitude || "-"}</strong></div>
            </div>
            {pharmacy.license && (
              <div className="license-section">
                <span>ใบประกอบวิชาชีพ</span>
                <a
                  href={`${API_URL}/licenses/${encodeURIComponent(pharmacy.license)}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img
                    src={`${API_URL}/licenses/${encodeURIComponent(pharmacy.license)}`}
                    alt={`ใบประกอบวิชาชีพของ ${pharmacy.pharmacy_name}`}
                    className="license-image"
                  />
                </a>
              </div>
            )}
          </section>
        ) : <p>กำลังโหลดข้อมูล...</p>}
      </main>
    </div>
  );
}

export default PharmacyDetail;