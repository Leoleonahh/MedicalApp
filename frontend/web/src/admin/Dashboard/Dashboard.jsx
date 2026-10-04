import "./Dashboard.css";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import api from "../../api/axios";

const cards = [
  {
    title: "1. ตรวจสอบสถิติการใช้งานระบบ",
    description: "ดูจำนวนผู้ใช้งาน การใช้งานรายวัน และประสิทธิภาพของระบบ",
    link: "/admin/statistics",
    color: "blue",
    icon: "📊",
  },
  {
    title: "2. แก้ไขข้อมูลโมเดล",
    description: "จัดการข้อมูล ปรับค่าพารามิเตอร์ และอัปเดตโมเดลวิเคราะห์",
    link: "/admin/model-edit",
    color: "green",
    icon: "🧠",
  },
  {
    title: "3. ตรวจสอบร้านขายยาที่ลงทะเบียน",
    description: "เรียกดูร้านยาทั้งหมด ตรวจสอบข้อมูล และสถานะการลงทะเบียน",
    link: "/admin/pharmacies",
    color: "pink",
    icon: "🏪",
  },
  {
    title: "4. อนุมัติร้านยาที่ลงทะเบียนเข้ามาในระบบ",
    description: "ตรวจสอบคำขอใหม่ และอนุมัติร้านยาที่ต้องการเข้าร่วมระบบ",
    link: "/admin/pharmacy-approvals",
    color: "orange",
    icon: "✅",
  },
];

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await api.get("/admin/stats");
        setStats(response.data?.data || null);
      } catch (error) {
        console.error("Load admin dashboard stats error:", error);
      }
    };

    loadStats();
  }, []);

  const statCards = [
    { label: "ผู้ใช้ทั้งหมด", value: stats?.total_users, tone: "blue" },
    { label: "การใช้งานวันนี้", value: stats?.active_today, tone: "green" },
    { label: "โมเดลที่ใช้งาน", value: stats?.active_models, tone: "pink" },
    { label: "ร้านยารออนุมัติ", value: stats?.pending_pharmacies, tone: "orange" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  return (
    <div className="admin-dashboard-page">
      <aside className="admin-sidebar">
        <div className="brand-box">
          <div className="brand-mark">M</div>
          <div>
            <h2>MedicalApp</h2>
            <span>Admin Panel</span>
          </div>
        </div>

        <nav className="admin-nav">
          <Link to="/admin/dashboard" className="nav-item active">Dashboard</Link>
          <Link to="/admin/statistics" className="nav-item">สถิติระบบ</Link>
          <Link to="/admin/model-edit" className="nav-item">ข้อมูลโมเดล</Link>
          <Link to="/admin/pharmacies" className="nav-item">ร้านขายยาที่ลงทะเบียน</Link>
          <Link to="/admin/pharmacy-approvals" className="nav-item">อนุมัติร้านยา</Link>
          <Link to="/admin" className="nav-item danger" onClick={handleLogout}>ออกจากระบบ</Link>
        </nav>
      </aside>

      <main className="admin-main">
        <header className="admin-header">
          <div>
            <p className="header-kicker">Overview</p>
            <h1>Dashboard</h1>
          </div>

          <div className="user-pill">Admin</div>
        </header>

        <section className="stats-grid">
          {statCards.map((item) => (
            <div key={item.label} className={`stat-card ${item.tone}`}>
              <div className="stat-topline">
                <span>{item.label}</span>
                <strong className="stat-delta">ข้อมูลจริง</strong>
              </div>
              {stats ? (
                <strong className="stat-value">{item.value}</strong>
              ) : (
                <span className="stat-value empty" aria-hidden="true" />
              )}
            </div>
          ))}
        </section>

        <section className="quick-grid">
          {cards.map((card) => (
            <Link key={card.title} to={card.link} className={`quick-card ${card.color}`}>
              <div className="card-icon">{card.icon}</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <span className="card-action">เปิดใช้งาน →</span>
            </Link>
          ))}
        </section>
      </main>
    </div>
  );
}

export default Dashboard;
