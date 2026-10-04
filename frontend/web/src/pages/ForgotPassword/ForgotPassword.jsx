import "./ForgotPassword.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useState } from "react";
import { forgotPassword } from "../../api/auth.api";

function ForgotPassword() {

  const navigate = useNavigate();

  // ===============================
  // เก็บค่า Email และ Username
  // ===============================

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  // ===============================
  // Submit Forgot Password
  // ===============================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setLoading(true);

    try {

      const result = await forgotPassword({
        email: email,
        username: username,
      });

      console.log("Forgot password response:", result);

      // ไปหน้า Verify OTP
      navigate("/forgotpassword/reset");

    } catch (error) {

      console.error("Forgot password error:", error);

      setError(
        error.response?.data?.message ||
        "ไม่สามารถส่งคำขอรีเซ็ตรหัสผ่านได้"
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <>
      <div className="top-bar">

        <button
          className="forgot-back"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
        </button>

      </div>


      <div className="container">

        <div className="card-box">

          <div className="card-left">

            <h2>รายละเอียดบัญชี</h2>

            <form onSubmit={handleSubmit}>

              <div className="input-box">

                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />

              </div>


              <div className="input-box">

                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />

              </div>


              <button
                type="submit"
                className="submit-btn"
                disabled={loading}
              >
                {loading ? "กำลังส่ง..." : "ยืนยัน"}
              </button>


              {error && (
                <p style={{ color: "red" }}>
                  {error}
                </p>
              )}

            </form>

          </div>


          <div className="card-right">
            <span>พื้นที่โฆษณา</span>
          </div>

        </div>

      </div>
    </>
  );
}

export default ForgotPassword;