import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { useState } from "react";
import { changePassword } from "../../api/auth.api";
import "./ChangePassword.css";

function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    oldPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const togglePassword = (field) => {
    setShowPasswords({ ...showPasswords, [field]: !showPasswords[field] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      await changePassword(form);
      alert("รหัสผ่านถูกเปลี่ยนเรียบร้อย");
      navigate("/profile");
    } catch (err) {
      console.error("Change password error:", err);
      setError(err.response?.data?.error || "ไม่สามารถเปลี่ยนรหัสผ่านได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="cp-page">
      <div className="cp-header">
        <Link to="/profile" className="cp-back">
          <FaArrowLeft />
        </Link>
        <div className="cp-title">รหัสผ่านใหม่</div>
      </div>

      <div className="cp-card">
        <div className="cp-left">
          <h3 className="cp-left-title">แก้ไขรหัสผ่าน</h3>

          <form className="cp-form" onSubmit={handleSubmit}>
            {[
              ["oldPassword", "Old Password"],
              ["newPassword", "New Password"],
              ["confirmPassword", "Confirm Password"],
            ].map(([field, placeholder]) => (
              <div className="cp-password-field" key={field}>
                <input
                  type={showPasswords[field] ? "text" : "password"}
                  name={field}
                  value={form[field]}
                  onChange={handleChange}
                  placeholder={placeholder}
                  required
                />
                <button
                  type="button"
                  className="cp-password-toggle"
                  onClick={() => togglePassword(field)}
                  aria-label={showPasswords[field] ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPasswords[field] ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
            ))}

            {error && <p className="cp-error">{error}</p>}

            <button type="submit" className="cp-submit" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "ยืนยัน"}
            </button>
          </form>
        </div>

        <div className="cp-right">
          <div className="cp-ad">พื้นที่โฆษณา</div>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;
