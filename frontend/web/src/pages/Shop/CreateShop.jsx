import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { registerPharmacy } from "../../api/pharmacy.api";
import "./CreateShop.css";

function CreateShop() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ shopname: "", email: "", phone: "", file: null, latitude: "", longitude: "" });
  const [loadingLat, setLoadingLat] = useState(false);
  const [loadingLong, setLoadingLong] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "file") {
      setForm({ ...form, file: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const setPosition = (type) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    const onSuccess = (pos) => {
      const coords = pos.coords;
      if (type === "lat") {
        setForm((s) => ({ ...s, latitude: coords.latitude.toFixed(6) }));
        setLoadingLat(false);
      } else {
        setForm((s) => ({ ...s, longitude: coords.longitude.toFixed(6) }));
        setLoadingLong(false);
      }
    };

    const onError = (err) => {
      alert("ไม่สามารถรับตำแหน่งได้: " + err.message);
      if (type === "lat") setLoadingLat(false);
      else setLoadingLong(false);
    };

    if (type === "lat") setLoadingLat(true);
    else setLoadingLong(true);

    navigator.geolocation.getCurrentPosition(onSuccess, onError, { enableHighAccuracy: true, timeout: 10000 });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.shopname || !form.email || !form.phone || !form.file) {
      setError("กรุณากรอกข้อมูลร้านค้าและเลือกรูปใบอนุญาตให้ครบถ้วน");
      return;
    }

    const data = new FormData();
    data.append("pharmacy_name", form.shopname);
    data.append("email", form.email);
    data.append("phone", form.phone);
    data.append("license", form.file);
    data.append("latitude", form.latitude);
    data.append("longitude", form.longitude);

    try {
      setLoading(true);
      await registerPharmacy(data);
      alert("ลงทะเบียนร้านค้าเรียบร้อย รอการอนุมัติจากแอดมิน");
      navigate("/profile");
    } catch (err) {
      console.error("Register pharmacy error:", err);
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          "ไม่สามารถลงทะเบียนร้านค้าได้"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-shop-page">
      <div className="cs-header">
        <Link to="/profile" className="cs-back"><FaArrowLeft /></Link>
        <div className="cs-title">ลงทะเบียน</div>
      </div>

      <div className="cs-card">
        <form className="cs-form" onSubmit={handleSubmit}>
          <input name="shopname" type="text" className="cs-input" placeholder="Shopname" value={form.shopname} onChange={handleChange} />
          <input name="email" type="email" className="cs-input" placeholder="Email" value={form.email} onChange={handleChange} />
          <input name="phone" type="tel" className="cs-input" placeholder="Phone" value={form.phone} onChange={handleChange} />
          <input name="file" type="file" onChange={handleChange} />

          <div className="cs-row">
            <button type="button" className="cs-btn small" onClick={() => setPosition("lat")}>{loadingLat ? "กำลังค้นหา..." : "ละติจูด"}</button>
            <button type="button" className="cs-btn small" onClick={() => setPosition("long")}>{loadingLong ? "กำลังค้นหา..." : "ลองติจูด"}</button>
          </div>

          <div className="cs-row cs-coords">
            <input readOnly value={form.latitude} placeholder="latitude" />
            <input readOnly value={form.longitude} placeholder="longitude" />
          </div>

          {error && <p className="cs-error">{error}</p>}

          <button type="submit" className="cs-submit" disabled={loading}>
            {loading ? "กำลังลงทะเบียน..." : "ลงทะเบียน"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default CreateShop;
