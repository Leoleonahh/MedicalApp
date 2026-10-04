import "./LoginAdmin.css";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { login } from "../../api/auth.api";

function LoginAdmin() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!username || !password) {
      setError("กรุณากรอก Username และ Password");
      return;
    }

    try {
      setLoading(true);
      const result = await login({ username, password });

      const user = result.user || result.data?.user;
      const token = result.token || result.data?.token;

      if (!user || user.role !== "admin") {
        setError("บัญชีนี้ไม่ใช่ Admin");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      navigate("/admin/dashboard");
    } catch (err) {
      console.error("Admin login error:", err);
      if (err.response?.data?.error) {
        setError(err.response.data.error);
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("ไม่สามารถเข้าสู่ระบบ Admin ได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-topbar" />

      <div className="admin-login-shell">
        <h1 className="admin-page-title">Login Admin</h1>

        <div className="admin-login-card">
          <form onSubmit={handleLogin} className="admin-login-form">
            <h2 className="admin-form-title">เข้าสู่ระบบ</h2>

            <div className="admin-input-box">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
              />
            </div>

            <div className="admin-input-box admin-password-box">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
              />

              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            {error && <p className="admin-error">{error}</p>}

            <button type="submit" className="admin-login-btn" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : "ลงชื่อเข้าใช้"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
