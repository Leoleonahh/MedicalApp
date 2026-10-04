import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../../api/auth.api";
import "./EditProfile.css";

function EditProfile() {
  const navigate = useNavigate();

  const getFormData = (user) => ({
    email: user?.email || "",
    address: user?.address || "",
    birthday: user?.birthday ? String(user.birthday).split("T")[0] : "",
  });

  const [form, setForm] = useState({
    ...getFormData(
      JSON.parse(localStorage.getItem("user") || "null")
    ),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const result = await getProfile();
        const user = result.user || result.data?.user;

        setForm(getFormData(user));
        localStorage.setItem("user", JSON.stringify(user));
      } catch (err) {
        console.error("Load profile for edit error:", err);
        setError(err.response?.data?.error || "");
      }
    };

    if (localStorage.getItem("token")) {
      loadProfile();
    } else {
      navigate("/login");
    }
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setLoading(true);
      const result = await updateProfile(form);
      const updatedUser = result.user || result.data?.user;
      const savedUser = JSON.parse(localStorage.getItem("user") || "{}");

      localStorage.setItem(
        "user",
        JSON.stringify({ ...savedUser, ...updatedUser })
      );
      alert("บันทึกข้อมูลเรียบร้อย");
      navigate("/profile");
    } catch (err) {
      console.error("Update profile error:", err);
      setError(err.response?.data?.error || "ไม่สามารถบันทึกข้อมูลโปรไฟล์ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="edit-page">
      <div className="edit-header">
        <Link to="/profile" className="edit-back">
          <FaArrowLeft />
        </Link>
        <div className="edit-title">แก้ไขโปรไฟล์</div>
      </div>

      <div className="edit-card">
        <form className="edit-form" onSubmit={handleSubmit}>
          <label>
            อีเมล
            <input name="email" type="email" value={form.email} onChange={handleChange} />
          </label>

          <label>
            ที่อยู่
            <input name="address" value={form.address} onChange={handleChange} />
          </label>

          <label>
            วันเกิด
            <input name="birthday" type="date" value={form.birthday} onChange={handleChange} />
          </label>

          {error && <p className="edit-error">{error}</p>}

          <div className="edit-actions">
            <button type="button" className="edit-cancel" onClick={() => navigate("/profile")}>ยกเลิก</button>
            <button type="submit" className="edit-save" disabled={loading}>
              {loading ? "กำลังบันทึก..." : "บันทึก"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditProfile;
