import "./SystemStats.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";

function SystemStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        setStats(response.data?.data || null);
      } catch (error) {
        console.error("Load system statistics error:", error);
      }
    };

    loadStats();
  }, []);

  const trafficData = stats?.usage_by_month || [];
  const maxUsage = Math.max(...trafficData.map((item) => item.count), 1);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <div className="system-stats-page">
      <aside className="system-sidebar">
        <div className="brand-box">
          <div className="brand-mark">M</div>
          <div>
            <h2>MedicalApp</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="system-nav">
          <Link to="/admin/dashboard" className="nav-item">Dashboard</Link>
          <Link to="/admin/statistics" className="nav-item active">สถิติระบบ</Link>
          <Link to="/admin/model-edit" className="nav-item">ข้อมูลโมเดล</Link>
          <Link to="/admin/pharmacies" className="nav-item">ร้านขายยาที่ลงทะเบียน</Link>
          <Link to="/admin/pharmacy-approvals" className="nav-item">อนุมัติร้านยา</Link>
          <Link to="/admin" className="nav-item danger" onClick={handleLogout}>ออกจากระบบ</Link>
        </nav>
      </aside>

      <main className="system-main">
        <header className="system-header">
          <div>
            <p className="header-kicker">System Overview</p>
            <h1>ตรวจสอบสถิติการใช้งานระบบ</h1>
          </div>

          <div className="user-pill">Admin</div>
        </header>

        <section className="stats-grid">
          {[
            { label: "ผู้ใช้ทั้งหมด", value: stats?.total_users, tone: "blue" },
            { label: "ใช้งานวันนี้", value: stats?.active_today, tone: "green" },
          ].map((item) => (
            <div key={item.label} className={`stat-card ${item.tone}`}>
              <div className="stat-topline">
                <span>{item.label}</span>
                <strong className="stat-delta">ข้อมูลจริง</strong>
              </div>
              {stats ? <strong className="stat-value">{item.value}</strong> : <div className="stat-empty" aria-hidden="true" />}
            </div>
          ))}
        </section>

        <section className="content-grid">
          <div className="panel panel-large">
            <div className="panel-header">
              <h3>แนวโน้มการใช้งานรายเดือน</h3>
              <span>ย้อนหลัง 8 เดือน</span>
            </div>

            <div className="chart-area">
              {trafficData.length ? trafficData.map((item) => (
                <div key={item.month} className="chart-column">
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: `${(item.count / maxUsage) * 100}%` }} />
                  </div>
                  <span>{item.month}</span>
                </div>
              )) : <p className="dashboard-empty">ยังไม่มีข้อมูลการใช้งาน</p>}
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3>สถานะระบบ</h3>
              <span>Live</span>
            </div>

            <div className="status-stack">
              <div className="status-item success"><div><label>API Server</label><strong>Healthy</strong></div><span>ปกติ</span></div>
              <div className="status-item success"><div><label>Database</label><strong>{stats?.system_status?.database || "กำลังตรวจสอบ"}</strong></div><span>ปกติ</span></div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default SystemStats;
