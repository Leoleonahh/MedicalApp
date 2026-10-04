import "./PharmacyApprovals.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";

function PharmacyApprovals() {
  const [pharmacies, setPharmacies] = useState([]);
  const [approvedCount, setApprovedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPendingPharmacies = async () => {
      try {
        const [pendingResponse, approvedResponse] = await Promise.all([
          api.get("/admin/pharmacies/pending"),
          api.get("/pharmacies/verified"),
        ]);
        setPharmacies(pendingResponse.data?.data || []);
        setApprovedCount(approvedResponse.data?.data?.length || 0);
      } catch (requestError) {
        console.error("Load pending pharmacies error:", requestError);
        setError(requestError.response?.data?.message || "ไม่สามารถโหลดคำขอร้านยาได้");
      } finally {
        setLoading(false);
      }
    };

    loadPendingPharmacies();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const handleApproval = async (pharmacyId, action) => {
    try {
      setActionId(pharmacyId);
      await api.patch(`/admin/pharmacies/${pharmacyId}/${action}`);
      setPharmacies((current) =>
        current.filter((pharmacy) => pharmacy.pharmacy_id !== pharmacyId)
      );
      if (action === "approve") {
        setApprovedCount((current) => current + 1);
      }
    } catch (requestError) {
      console.error(`Pharmacy ${action} error:`, requestError);
      setError(requestError.response?.data?.message || "ไม่สามารถเปลี่ยนสถานะร้านยาได้");
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="approval-page">
      <aside className="approval-sidebar">
        <div className="approval-brand">
          <div className="approval-brand-mark">M</div>
          <div>
            <h2>MedicalApp</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="approval-nav">
          <Link to="/admin/dashboard" className="approval-nav-item">Dashboard</Link>
          <Link to="/admin/statistics" className="approval-nav-item">สถิติระบบ</Link>
          <Link to="/admin/model-edit" className="approval-nav-item">ข้อมูลโมเดล</Link>
          <Link to="/admin/pharmacies" className="approval-nav-item">ร้านขายยาที่ลงทะเบียน</Link>
          <Link to="/admin/pharmacy-approvals" className="approval-nav-item active">อนุมัติร้านยา</Link>
          <Link to="/admin" className="approval-nav-item danger" onClick={handleLogout}>ออกจากระบบ</Link>
        </nav>
      </aside>

      <main className="approval-main">
        <header className="approval-header">
          <div>
            <p className="approval-kicker">Pharmacy Registration</p>
            <h1>อนุมัติร้านยาที่ลงทะเบียนเข้ามาในระบบ</h1>
            <p className="approval-description">ตรวจสอบคำขอสมัครร้านยาและจัดการสถานะการลงทะเบียน</p>
          </div>
          <div className="approval-user">Admin</div>
        </header>

        <section className="approval-summary">
          <div className="approval-summary-box">
            <span>คำขอทั้งหมด</span>
            <strong>{loading ? "-" : pharmacies.length}</strong>
          </div>
          <div className="approval-summary-box">
            <span>รอตรวจสอบ</span>
            <strong>{loading ? "-" : pharmacies.length}</strong>
          </div>
          <div className="approval-summary-box">
            <span>อนุมัติแล้ว</span>
            <strong>{loading ? "-" : approvedCount}</strong>
          </div>
        </section>

        <section className="approval-panel">
          <div className="approval-panel-heading">
            <div>
              <h2>รายการคำขอลงทะเบียน</h2>
              <p>ตรวจสอบร้านยาที่รอการอนุมัติ</p>
            </div>
            <span className="approval-filter-placeholder" aria-hidden="true" />
          </div>

          {error && <p className="approval-error">{error}</p>}

          <div className="approval-table-wrapper">
            <table className="approval-table">
              <thead>
                <tr>
                  <th>ชื่อร้านยา</th>
                  <th>เบอร์โทร</th>
                  <th>อีเมล</th>
                  <th>ละติจูด</th>
                  <th>ลองจิจูด</th>
                  <th>ใบประกอบวิชาชีพ</th>
                  <th>วันที่ลงทะเบียน</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8">กำลังโหลดข้อมูล...</td></tr>
                ) : pharmacies.length ? pharmacies.map((pharmacy) => (
                  <tr key={pharmacy.pharmacy_id}>
                    <td>
                      <Link
                        to={`/admin/pharmacies/${pharmacy.pharmacy_id}`}
                        className="approval-pharmacy-link"
                      >
                        {pharmacy.pharmacy_name || "-"}
                      </Link>
                    </td>
                    <td>{pharmacy.phone || "-"}</td>
                    <td>{pharmacy.email || "-"}</td>
                    <td>{pharmacy.latitude || "-"}</td>
                    <td>{pharmacy.longitude || "-"}</td>
                    <td>{pharmacy.license || "-"}</td>
                    <td>{pharmacy.created_at ? new Date(pharmacy.created_at).toLocaleDateString("th-TH") : "-"}</td>
                    <td className="approval-actions">
                      <button
                        type="button"
                        className="approval-button"
                        onClick={() => handleApproval(pharmacy.pharmacy_id, "approve")}
                        disabled={actionId === pharmacy.pharmacy_id}
                      >
                        อนุมัติ
                      </button>
                      <button
                        type="button"
                        className="approval-button reject-button"
                        onClick={() => handleApproval(pharmacy.pharmacy_id, "reject")}
                        disabled={actionId === pharmacy.pharmacy_id}
                      >
                        ไม่อนุมัติ
                      </button>
                    </td>
                  </tr>
                )) : <tr><td colSpan="8">ไม่มีร้านยาที่รออนุมัติ</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}

export default PharmacyApprovals;
