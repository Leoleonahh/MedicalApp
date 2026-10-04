// ...existing code...
import "./Register.css";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { register } from "../../api/auth.api";

function Register() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();

    setError("");

    if (!username || !password || !confirmPassword) {
      setError("กรุณากรอก Username, Password และ Confirm Password");
      return;
    }

    if (password !== confirmPassword) {
      setError("Password และ Confirm Password ไม่ตรงกัน");
      return;
    }

    try {
      setLoading(true);

      const result = await register({
        username,
        password,
      });

      if (result.token) {
        localStorage.setItem("token", result.token);
      }

      if (result.user) {
        localStorage.setItem("user", JSON.stringify(result.user));
      }

      console.log("Register success:", result);

      navigate("/");
    } catch (error) {
      console.error("Register error:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError("ไม่สามารถสมัครสมาชิกได้ กรุณาลองใหม่อีกครั้ง");
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
            <h2>สมัครเข้าใช้งาน</h2>

            <form onSubmit={handleRegister}>
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

              <div className="input-box password-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={showConfirmPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showConfirmPassword ? (
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
                {loading ? "กำลังสมัครสมาชิก..." : "สมัครเข้าใช้งาน"}
              </button>
            </form>

            <p className="switch-page">
              มีบัญชีแล้ว ?
              <Link to="/"> เข้าสู่ระบบ</Link>
            </p>
          </div>

          <div className="right">พื้นที่โฆษณา</div>
        </div>
      </div>
    </>
  );
}

export default Register;