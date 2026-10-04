import "./Predict.css";

import { Link, useNavigate } from "react-router-dom";

import { FaArrowLeft } from "react-icons/fa";
import { FiUpload } from "react-icons/fi";
import { useEffect, useRef, useState } from "react";

import {
  getRecommendation,
  uploadWound,
} from "../../api/wound.api";

function Predict() {

  const navigate = useNavigate();

  // ===============================
  // File
  // ===============================

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  // ===============================
  // Form data
  // ===============================

  const [associatedSymptom, setAssociatedSymptom] = useState("");
  const [incidentDate, setIncidentDate] = useState("");
  const [woundSite, setWoundSite] = useState("");

  // ===============================
  // Location
  // ===============================

  const [coordinates, setCoordinates] = useState({
    latitude: "",
    longitude: ""
  });

  const [locationError, setLocationError] = useState("");

  // ===============================
  // Loading / Error
  // ===============================

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const submitInProgress = useRef(false);

  useEffect(() => {
    if (!image) {
      setImagePreview("");
      return;
    }

    const previewUrl = URL.createObjectURL(image);
    setImagePreview(previewUrl);

    return () => URL.revokeObjectURL(previewUrl);
  }, [image]);

  // ===============================
  // Get location
  // ===============================

  const handleGetLocation = () => {

    if (!navigator.geolocation) {

      setLocationError(
        "เบราว์เซอร์ไม่รองรับตำแหน่งปัจจุบัน"
      );

      return;
    }

    navigator.geolocation.getCurrentPosition(

      (position) => {

        const lat =
          position.coords.latitude.toFixed(6);

        const lon =
          position.coords.longitude.toFixed(6);

        setCoordinates({
          latitude: lat,
          longitude: lon
        });

        setLocationError("");
      },

      () => {

        setLocationError(
          "ไม่สามารถรับตำแหน่งได้ ลองใหม่อีกครั้ง"
        );

      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // ===============================
  // Select image
  // ===============================

  const handleImageChange = (e) => {

    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setImage(file);
    setError("");
  };

  const handleUseToday = () => {
    const today = new Date();
    const localDate = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    setIncidentDate(localDate);
  };

  // ===============================
  // Upload wound
  // ===============================

  const handleSubmit = async (e) => {

    e.preventDefault();

    if (submitInProgress.current) {
      return;
    }

    setError("");

    // ตรวจสอบรูป
    if (!image) {

      setError("กรุณาเลือกรูปบาดแผล");

      return;
    }

    try {

      submitInProgress.current = true;
      setLoading(true);

      const result = await uploadWound({

        image,

        associated_symptom: associatedSymptom,

        incident_date: incidentDate,

        wound_site: woundSite,

        latitude: coordinates.latitude,

        longitude: coordinates.longitude,

      });

      const uploadData = result.data || result;

      if (!uploadData.image_id) {
        throw new Error("ไม่พบ image_id จากการอัปโหลดรูปภาพ");
      }

      const predictionData = uploadData.prediction;

      if (!predictionData.prediction_id) {
        throw new Error("ไม่พบผลการพยากรณ์จากการอัปโหลดรูปภาพ");
      }

      const isNoWound = predictionData.predict_label === "ไม่มีบาดแผล";
      let recommendation = null;

      if (!isNoWound) {
        const recommendationResult = await getRecommendation(
          predictionData.prediction_id
        );
        recommendation = recommendationResult.data || recommendationResult;
      }

      sessionStorage.setItem(
        "woundUpload",
        JSON.stringify({
          upload: uploadData,
          prediction: predictionData,
          recommendation,
        })
      );

      navigate("/result");

    } catch (error) {

      console.error(
        "Upload wound error:",
        error
      );

      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        "ไม่สามารถอัปโหลดบาดแผลได้"
      );

    } finally {

      submitInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <div className="predict-page">

      {/* top */}
      <div className="predict-topbar">

        <Link
          to="/home"
          className="back-btn"
        >
          <FaArrowLeft />
        </Link>

      </div>

      {/* main */}
      <div className="predict-main">

        {/* upload */}
        <div className="upload-section">

          <h2>อัปโหลด</h2>

          <label className="upload-box">

            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleImageChange}
            />

            {imagePreview ? (
              <>
                <img className="upload-preview" src={imagePreview} alt="ตัวอย่างรูปบาดแผลที่เลือก" />
                <p>แตะเพื่อเปลี่ยนรูปภาพ</p>
              </>
            ) : (
              <>
                <FiUpload className="upload-icon" />
                <p>แนบรูปถ่าย</p>
              </>
            )}

          </label>

        </div>

        {/* detail */}
        <div className="detail-section">

          <h2>รายละเอียดเพิ่มเติม</h2>

          <form
            className="detail-form"
            onSubmit={handleSubmit}
          >

            <div className="input-group">

              <label>

                <span>
                  อาการแทรกซ้อน
                </span>

                <input
                  type="text"
                  placeholder="กรอกอาการแทรกซ้อน"
                  value={associatedSymptom}
                  onChange={(e) =>
                    setAssociatedSymptom(
                      e.target.value
                    )
                  }
                />

              </label>

            </div>

            <div className="input-group">

              <label>

                <span>
                  วันที่เกิดบาดแผล
                </span>

                <button
                  type="button"
                  className="today-date-button"
                  onClick={handleUseToday}
                >
                  {incidentDate
                    ? new Date(`${incidentDate}T00:00:00`).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })
                    : "กดเพื่อเลือกวันที่ปัจจุบัน"}
                </button>

              </label>

            </div>

            <div className="input-group">

              <label>

                <span>
                  ตำแหน่งของบาดแผล
                </span>

                <input
                  type="text"
                  placeholder="ระบุตำแหน่งของบาดแผล"
                  value={woundSite}
                  onChange={(e) =>
                    setWoundSite(
                      e.target.value
                    )
                  }
                />

              </label>

            </div>

            <div className="detail-row">

              <label>

                <span>
                  ละติจูด
                </span>

                <input
                  type="text"
                  value={coordinates.latitude}
                  placeholder="แตะเพื่อรับตำแหน่งปัจจุบัน"
                  readOnly
                  onClick={handleGetLocation}
                />

              </label>

              <label>

                <span>
                  ลองติจูด
                </span>

                <input
                  type="text"
                  value={coordinates.longitude}
                  placeholder="แตะเพื่อรับตำแหน่งปัจจุบัน"
                  readOnly
                  onClick={handleGetLocation}
                />

              </label>

            </div>

            {locationError && (
              <p className="location-error">
                {locationError}
              </p>
            )}

            {error && (
              <p className="location-error">
                {error}
              </p>
            )}

            <div className="predict-btn-box">

              <button
                type="submit"
                className="predict-btn"
                disabled={loading}
              >

                {loading
                  ? "กำลังอัปโหลด..."
                  : "พยากรณ์"}

              </button>

            </div>

          </form>

        </div>

      </div>

    </div>
  );
}

export default Predict;