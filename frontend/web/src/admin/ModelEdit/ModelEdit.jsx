import "./ModelEdit.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";

function ModelEdit() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadModels = async () => {
      try {
        const response = await api.get("/api/train");
        setModels(response.data?.data || []);
      } catch (requestError) {
        console.error("Load models error:", requestError);
        setError(requestError.response?.data?.error || "ไม่สามารถโหลดข้อมูลโมเดลได้");
      } finally {
        setLoading(false);
      }
    };

    loadModels();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const latestModel = models[0];
  const averageAccuracy = models.length
    ? models.reduce((total, model) => total + (Number(model.accuracy) || 0), 0) / models.length
    : 0;

  return (
    <div className="model-edit-page">
      <aside className="model-sidebar">
        <div className="brand-box">
          <div className="brand-mark">M</div>
          <div>
            <h2>MedicalApp</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="model-nav">
          <Link to="/admin/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/admin/statistics" className="nav-item">สถิติระบบ</Link>
          <Link to="/admin/model-edit" className="nav-item active">ข้อมูลโมเดล</Link>
          <Link to="/admin/pharmacies" className="nav-item">ร้านขายยาที่ลงทะเบียน</Link>
          <Link to="/admin/pharmacy-approvals" className="nav-item">อนุมัติร้านยา</Link>
          <Link to="/admin" className="nav-item danger" onClick={handleLogout}>ออกจากระบบ</Link>
        </nav>
      </aside>

      <main className="model-main">
        <header className="model-header">
          <div>
            <p className="header-kicker">Model Management</p>
            <h1>แก้ไขข้อมูลโมเดล</h1>
          </div>

          <div className="user-pill">Admin</div>
        </header>

        <section className="panel summary-panel">
          <div className="panel-header">
            <h3>สรุปโมเดล</h3>
          </div>

          <div className="summary-row">
            <div className="summary-box">
              <span>โมเดลที่ใช้งาน</span>
              {loading ? <span className="placeholder-box" aria-hidden="true" /> : <strong>{latestModel?.model_name || "-"}</strong>}
            </div>
            <div className="summary-box">
              <span>กำลังใช้งาน</span>
              {loading ? <span className="placeholder-box" aria-hidden="true" /> : <strong>{latestModel?.version || "-"}</strong>}
            </div>
            <div className="summary-box">
              <span>ความแม่นยำเฉลี่ย</span>
              {loading ? <span className="placeholder-box" aria-hidden="true" /> : <strong>{models.length ? `${(averageAccuracy * 100).toFixed(2)}%` : "-"}</strong>}
            </div>
          </div>
        </section>

        <section className="panel table-panel">
            <div className="panel-header">
            <h3>รายการโมเดล</h3>
          </div>

            {error && <p className="model-message model-error">{error}</p>}

          <table className="model-table">
            <thead>
              <tr>
                <th>ชื่อโมเดล</th>
                <th>เวอร์ชัน</th>
                <th>อัปเดตล่าสุด</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="3"><span className="placeholder-text" aria-hidden="true" /></td>
                </tr>
              ) : models.length ? models.map((model) => (
                <tr key={model.model_id}>
                  <td>{model.model_name || "-"}</td>
                  <td>{model.version || "-"}</td>
                  <td>{model.action_date || model.created_at ? new Date(model.action_date || model.created_at).toLocaleString("th-TH") : "-"}</td>
                </tr>
              )) : (
                <tr><td colSpan="3">ไม่พบข้อมูลโมเดล</td></tr>
              )}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}

export default ModelEdit;
