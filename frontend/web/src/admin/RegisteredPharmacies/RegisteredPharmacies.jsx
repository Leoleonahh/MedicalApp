import "./RegisteredPharmacies.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";

function RegisteredPharmacies() {
  const [pharmacies, setPharmacies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPharmacies = async () => {
      try {
        const [verifiedResponse, pendingResponse] = await Promise.all([
          api.get("/pharmacies/verified"),
          api.get("/admin/pharmacies/pending"),
        ]);
        const verified = verifiedResponse.data?.data || [];
        const pending = pendingResponse.data?.data || [];
        setPharmacies([...verified, ...pending]);
      } catch (requestError) {
        console.error("Load pharmacies error:", requestError);
        setError(requestError.response?.data?.message || "ไม่สามารถโหลดข้อมูลร้านขายยาได้");
      } finally {
        setLoading(false);
      }
    };

    loadPharmacies();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const verifiedCount = pharmacies.filter((pharmacy) => pharmacy.status === "verify").length;
  const pendingCount = pharmacies.filter((pharmacy) => pharmacy.status === "notverify").length;

  return (
    <div className="pharmacy-page">
      <aside className="pharmacy-sidebar">
        <div className="brand-box">
          <div className="brand-mark">M</div>
          <div>
            <h2>MedicalApp</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="pharmacy-nav">
          <Link to="/admin/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/admin/statistics" className="nav-item">สถิติระบบ</Link>
          <Link to="/admin/model-edit" className="nav-item">ข้อมูลโมเดล</Link>
          <Link to="/admin/pharmacies" className="nav-item active">ร้านขายยาที่ลงทะเบียน</Link>
          <Link to="/admin/pharmacy-approvals" className="nav-item">อนุมัติร้านยา</Link>
          <Link to="/admin" className="nav-item danger" onClick={handleLogout}>ออกจากระบบ</Link>
        </nav>
      </aside>

      <main className="pharmacy-main">
        <header className="pharmacy-header">
          <div>
            <p className="header-kicker">Registered Stores</p>
            <h1>ตรวจสอบร้านขายยาที่ลงทะเบียน</h1>
          </div>

          <div className="user-pill">Admin</div>
        </header>

        <section className="panel summary-panel">
          <div className="panel-header">
            <h3>ภาพรวมร้านยา</h3>
          </div>

          <div className="summary-row">
            <div className="summary-box">
              <span>ร้านทั้งหมด</span>
              <strong>{loading ? "-" : pharmacies.length}</strong>
            </div>
            <div className="summary-box">
              <span>เปิดใช้งาน</span>
              <strong>{loading ? "-" : verifiedCount}</strong>
            </div>
            <div className="summary-box">
              <span>รออนุมัติ</span>
              <strong>{loading ? "-" : pendingCount}</strong>
            </div>
          </div>
        </section>

        <section className="panel table-panel">
          <div className="panel-header">
            <h3>รายการร้านขายยา</h3>
          </div>

          {error && <p className="pharmacy-message pharmacy-error">{error}</p>}

          <table className="pharmacy-table">
            <thead>
              <tr>
                <th>ชื่อร้าน</th>
                <th>เจ้าของร้าน</th>
                <th>เบอร์โทร</th>
                <th>สถานะ</th>
                <th>อัปเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5">กำลังโหลดข้อมูล...</td></tr>
              ) : pharmacies.length ? pharmacies.map((pharmacy) => (
                <tr key={pharmacy.pharmacy_id}>
                  <td>
                    <Link to={`/admin/pharmacies/${pharmacy.pharmacy_id}`} className="pharmacy-link">
                      {pharmacy.pharmacy_name || "-"}
                    </Link>
                  </td>
                  <td>{pharmacy.user?.username || "-"}</td>
                  <td>{pharmacy.phone || "-"}</td>
                  <td><span className={`status-badge ${pharmacy.status === "verify" ? "verified" : "pending"}`}>
                    {pharmacy.status === "verify" ? "เปิดใช้งาน" : "รออนุมัติ"}
                  </span></td>
                  <td>{pharmacy.created_at ? new Date(pharmacy.created_at).toLocaleDateString("th-TH") : "-"}</td>
                </tr>
              )) : <tr><td colSpan="5">ไม่พบข้อมูลร้านขายยา</td></tr>}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default RegisteredPharmacies;
