import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  FaArrowLeft,
  FaArrowRight,
  FaKey,
  FaSignOutAlt,
  FaStore,
  FaTachometerAlt,
  FaUserEdit,
} from "react-icons/fa";
import { getProfile } from "../../api/auth.api";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const adminWindowRef = useRef(null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const adminDashboardUrl = import.meta.env.VITE_ADMIN_APP_URL
    ? new URL("/admin/dashboard", import.meta.env.VITE_ADMIN_APP_URL).toString()
    : import.meta.env.DEV
      ? `${window.location.protocol}//${window.location.hostname}:4174/admin/dashboard`
      : "/admin/dashboard";

  useEffect(() => {
    const adminOrigin = new URL(adminDashboardUrl).origin;
    const handleAdminReady = (event) => {
      if (
        event.origin !== adminOrigin ||
        event.source !== adminWindowRef.current ||
        event.data?.type !== "MEDICALAPP_ADMIN_AUTH_READY"
      ) {
        return;
      }

      const token = localStorage.getItem("token");
      if (!token || String(user?.role || "").toLowerCase() !== "admin") return;

      event.source.postMessage(
        {
          type: "MEDICALAPP_ADMIN_AUTH",
          token,
          user,
        },
        adminOrigin
      );
    };

    window.addEventListener("message", handleAdminReady);
    return () => window.removeEventListener("message", handleAdminReady);
  }, [adminDashboardUrl, user]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await getProfile();
        const profile = result.user || result.data?.user;

        setUser(profile);
        setIsAdmin(String(profile?.role || "").toLowerCase() === "admin");
        localStorage.setItem("user", JSON.stringify(profile));
      } catch (err) {
        console.error("Load profile error:", err);
        setError(err.response?.data?.error || "");
      }
    };

    if (localStorage.getItem("token")) {
      loadProfile();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const openAdminDashboard = () => {
    const adminWindow = window.open(adminDashboardUrl, "_blank");
    if (!adminWindow) {
      setError("อนุญาตให้เปิดหน้าต่างใหม่เพื่อเข้าสู่ Admin Dashboard");
      return;
    }

    adminWindowRef.current = adminWindow;
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <Link to="/home" className="profile-back" aria-label="กลับหน้าหลัก">
          <FaArrowLeft />
        </Link>
        <div className="profile-header-title">
          <span>ACCOUNT</span>
          <h1>โปรไฟล์</h1>
        </div>
        <button className="profile-logout" onClick={handleLogout}>
          <FaSignOutAlt />
          <span>ออกจากระบบ</span>
        </button>
      </div>

      <main className="profile-layout">
        <section className="profile-card">
          <div className="profile-identity">
            <div className="profile-avatar-icon">
              {user?.username?.charAt(0).toUpperCase() || "A"}
            </div>
            <div>
              <span className="profile-eyebrow">บัญชีผู้ใช้</span>
              <h2 className="profile-name">{user?.username || "ผู้ใช้งาน"}</h2>
              <span className="profile-role">
                {isAdmin ? "ผู้ดูแลระบบ" : "สมาชิก"}
              </span>
            </div>
          </div>

          <div className="profile-info">
            <div className="profile-field">
              <span>อีเมล</span>
              <strong>{user?.email || "-"}</strong>
            </div>
            <div className="profile-field">
              <span>ที่อยู่</span>
              <strong>{user?.address || "-"}</strong>
            </div>
            <div className="profile-field">
              <span>วันเกิด</span>
              <strong>{user?.birthday || "-"}</strong>
            </div>
          </div>
        </section>

        <section className="profile-actions">
          <div className="profile-section-heading">
            <span>ตั้งค่าและการจัดการ</span>
            <h2>เมนูบัญชี</h2>
          </div>

          {error && <p className="profile-error">{error}</p>}

          <div className="profile-action-list">
            <Link to="/profile/edit" className="profile-button">
              <FaUserEdit />
              <span>แก้ไขข้อมูลโปรไฟล์</span>
              <FaArrowRight className="profile-action-arrow" />
            </Link>
            <Link to="/shop/create" className="profile-button">
              <FaStore />
              <span>สร้างร้านค้า</span>
              <FaArrowRight className="profile-action-arrow" />
            </Link>
            <Link to="/shop/select" className="profile-button">
              <FaStore />
              <span>จัดการร้านค้า</span>
              <FaArrowRight className="profile-action-arrow" />
            </Link>
            <Link to="/profile/change-password" className="profile-button">
              <FaKey />
              <span>เปลี่ยนรหัสผ่าน</span>
              <FaArrowRight className="profile-action-arrow" />
            </Link>
            {isAdmin && (
              <button
                type="button"
                onClick={openAdminDashboard}
                className="profile-button profile-admin-button"
              >
                <FaTachometerAlt />
                <span>Admin Dashboard</span>
                <FaArrowRight className="profile-action-arrow" />
              </button>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;
