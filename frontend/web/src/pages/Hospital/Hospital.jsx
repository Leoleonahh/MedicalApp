import "./Hospital.css";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Topbar from "../../layouts/Topbar";

function Hospital() {
  const [coordinates, setCoordinates] = useState(null);
  const [locationError, setLocationError] = useState(() =>
    typeof navigator !== "undefined" && !navigator.geolocation
      ? "เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง"
      : ""
  );

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("เบราว์เซอร์นี้ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        });
      },
      () => setLocationError("ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่งแล้วลองอีกครั้ง"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setCoordinates({
          latitude: coords.latitude.toFixed(6),
          longitude: coords.longitude.toFixed(6),
        });
      },
      () => setLocationError("ไม่สามารถระบุตำแหน่งได้ กรุณาอนุญาตการเข้าถึงตำแหน่งแล้วลองอีกครั้ง"),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const mapUrl = coordinates
    ? `https://www.google.com/maps?q=${coordinates.latitude},${coordinates.longitude}&z=15&output=embed`
    : "https://www.google.com/maps?q=โรงพยาบาลใกล้ฉัน&output=embed";

  return (
    <div className="hospital-page">

      {/* top */}
      <Topbar />

      {/* navbar */}
      <div className="hospital-navbar">

        <Link to="/home">
          ← กลับหน้าหลัก
        </Link>

        <h2>โรงพยาบาลใกล้เคียง</h2>

      </div>

      {/* map */}
      <div className="map-container">
        <div className="map-wrapper">
          <iframe
            title="hospital-map"
            src={mapUrl}
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
          ></iframe>
          <div className="map-location-status" aria-live="polite">
            {coordinates ? (
              <span>หมุดแสดงตำแหน่งปัจจุบันของคุณ</span>
            ) : locationError ? (
              <>
                <span>{locationError}</span>
                <button type="button" onClick={getCurrentLocation}>ลองระบุตำแหน่งอีกครั้ง</button>
              </>
            ) : (
              <span>กำลังระบุตำแหน่งปัจจุบัน...</span>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}

export default Hospital;