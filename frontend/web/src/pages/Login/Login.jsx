// ...existing code...
import "./Login.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { login } from "../../api/auth.api";

function Login() {
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

      const result = await login({
        username,
        password,
      });

      localStorage.setItem("token", result.token);
      localStorage.setItem("user", JSON.stringify(result.user));

      console.log("Login success");
      console.log("User:", result.user);
      console.log("Token:", result.token);

      navigate("/home");
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="top-bar"></div>

      <div className="container">
        <div className="login-box">
          <div className="left">
            <h2>เข้าสู่ระบบ</h2>

            <form onSubmit={handleLogin}>
              <div className="input-box">
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div className="input-box password-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 3l18 18" />
                      <path d="M10.58 10.58A2 2 0 0 0 13.42 13.42" />
                      <path d="M9.88 5.08A10.94 10.94 0 0 1 12 5c6.5 0 10 7 10 7a17.47 17.47 0 0 1-5.12 6.1" />
                      <path d="M6.61 6.61A17.39 17.39 0 0 0 2 12s3.5 7 10 7a9.87 9.87 0 0 0 5.39-1.61" />
                    </svg>
                  )}
                </button>
              </div>

              {error && <p style={{ color: "red" }}>{error}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "กำลังเข้าสู่ระบบ..." : "ลงชื่อเข้าใช้"}
              </button>
            </form>

            <p className="switch-page">
              <Link to="/forgotpassword">ลืมรหัสผ่าน</Link>
            </p>

            <p className="switch-page">
              ยังไม่มีบัญชี ?
              <Link to="/register"> สมัครสมาชิก</Link>
            </p>
          </div>

          <div className="right">พื้นที่โฆษณา</div>
        </div>
      </div>
    </>
  );
}

export default Login;