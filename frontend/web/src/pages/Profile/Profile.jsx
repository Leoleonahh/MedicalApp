import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { getProfile } from "../../api/auth.api";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await getProfile();
        const profile = result.user || result.data?.user;

        setUser(profile);
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

  return (
    <div className="profile-page">
      <div className="profile-header">
        <Link to="/home" className="profile-back">
          <FaArrowLeft />
        </Link>
        <div className="profile-header-title">โปรไฟล์</div>
        <button className="profile-logout" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="profile-card">
        <div className="profile-avatar">
          <div className="profile-avatar-icon">
            {user?.username?.charAt(0).toUpperCase() || "A"}
          </div>
        </div>

        <div className="profile-info">
          <div className="profile-name">{user?.username || "-"}</div>
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
      </div>

      {error && <p className="profile-error">{error}</p>}

      <div className="profile-actions">
        <Link to="/profile/edit" className="profile-button secondary">
          แก้ไขข้อมูลโปรไฟล์
        </Link>
        <Link to="/shop/create" className="profile-button primary">
          สร้างร้านค้า
        </Link>
        <Link to="/shop/select" className="profile-button secondary">
          จัดการร้านค้า
        </Link>
        <Link to="/profile/change-password" className="profile-button secondary">
          เปลี่ยนรหัสผ่าน
        </Link>
      </div>
    </div>
  );
}

export default Profile;
