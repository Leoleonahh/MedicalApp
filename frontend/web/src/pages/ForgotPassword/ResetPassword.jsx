import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";
import "./ResetPassword.css";

import {
  verifyOTP,
  resetPassword,
} from "../../api/auth.api";

function ResetPassword() {

  const navigate = useNavigate();

  // ===============================
  // Form data
  // ===============================

  const [username, setUsername] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ===============================
  // State
  // ===============================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  // ===============================
  // Submit
  // ===============================

  const handleSubmit = async (e) => {

    e.preventDefault();

    setError("");
    setSuccess("");
    setLoading(true);

    try {

      // =====================================
      // 1. Verify OTP
      // =====================================

      const verifyResult = await verifyOTP({
        username: username,
        otp: otp,
      });

      console.log(
        "Verify OTP response:",
        verifyResult
      );


      // =====================================
      // 2. Reset Password
      // =====================================

      const resetResult = await resetPassword({

        username: username,

        otp: otp,

        newPassword: newPassword,

        confirmPassword: confirmPassword,

      });

      console.log(
        "Reset password response:",
        resetResult
      );


      // =====================================
      // สำเร็จ
      // =====================================

      setSuccess(
        "เปลี่ยนรหัสผ่านสำเร็จ"
      );

      // กลับหน้า Login
      setTimeout(() => {

        navigate("/");

      }, 1500);


    } catch (error) {

      console.error(
        "Reset password error:",
        error
      );

      setError(
        error.response?.data?.message ||
        error.response?.data?.error ||
        "ไม่สามารถเปลี่ยนรหัสผ่านได้"
      );

    } finally {

      setLoading(false);

    }
  };


  return (
    <>
      <div className="reset-topbar">

        <button
          className="reset-back"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft />
        </button>

      </div>


      <div className="reset-container">

        <div className="reset-title">
          รีเซ็ตรหัสผ่าน
        </div>


        <div className="reset-card">

          <div className="reset-header">
            กรุณากรอกรหัสผ่านใหม่ที่ต้องการจะเปลี่ยน
          </div>


          <form
            className="reset-form"
            onSubmit={handleSubmit}
          >

            {/* Username */}

            <div className="reset-input-group">

              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) =>
                  setUsername(e.target.value)
                }
                required
              />

            </div>


            {/* OTP */}

            <div className="reset-input-group">

              <input
                type="text"
                placeholder="OTP"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value)
                }
                required
              />

            </div>


            {/* New Password */}

            <div className="reset-input-group reset-password-group">

              <input
                type={showNewPassword ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(e.target.value)
                }
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowNewPassword((previous) => !previous)}
                aria-label={showNewPassword ? "ซ่อนรหัสผ่านใหม่" : "แสดงรหัสผ่านใหม่"}
              >
                {showNewPassword ? <FaEyeSlash /> : <FaEye />}
              </button>

            </div>


            {/* Confirm Password */}

            <div className="reset-input-group reset-password-group">

              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(e.target.value)
                }
                required
              />

              <button
                type="button"
                className="reset-password-toggle"
                onClick={() => setShowConfirmPassword((previous) => !previous)}
                aria-label={showConfirmPassword ? "ซ่อนการยืนยันรหัสผ่าน" : "แสดงการยืนยันรหัสผ่าน"}
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>

            </div>


            {/* Error */}

            {error && (
              <p style={{ color: "red" }}>
                {error}
              </p>
            )}


            {/* Success */}

            {success && (
              <p style={{ color: "green" }}>
                {success}
              </p>
            )}


            {/* Submit */}

            <button
              type="submit"
              className="reset-button"
              disabled={loading}
            >

              {loading
                ? "กำลังดำเนินการ..."
                : "ยืนยัน"}

            </button>

          </form>

        </div>

      </div>
    </>
  );
}

export default ResetPassword;