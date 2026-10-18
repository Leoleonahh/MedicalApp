import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCrosshairs, FaSearch } from "react-icons/fa";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { registerPharmacy } from "../../api/pharmacy.api";
import "leaflet/dist/leaflet.css";
import "./CreateShop.css";

const defaultMapCenter = [13.7563, 100.5018];
const mapMarkerIcon = L.icon({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapViewport({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) map.flyTo(position, 16);
  }, [map, position]);

  return null;
}

function MapClickPicker({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });

  return null;
}

function CreateShop() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ shopname: "", email: "", phone: "", file: null, latitude: "", longitude: "" });
  const [locationQuery, setLocationQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [mapPosition, setMapPosition] = useState(defaultMapCenter);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [locationLabel, setLocationLabel] = useState("");
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

  const selectPosition = (latitude, longitude, label = "เลือกจากแผนที่") => {
    const position = [latitude, longitude];
    setSelectedPosition(position);
    setMapPosition(position);
    setForm((current) => ({
      ...current,
      latitude: latitude.toFixed(6),
      longitude: longitude.toFixed(6),
    }));
    setLocationLabel(label);
    setLocationError("");
    setSearchResults([]);
  };

  const searchLocation = async () => {
    const query = locationQuery.trim();
    if (!query) return;

    try {
      setSearchingLocation(true);
      setLocationError("");
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        addressdetails: "1",
        countrycodes: "th",
        limit: "5",
      });
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`
      );
      if (!response.ok) throw new Error("ค้นหาตำแหน่งไม่สำเร็จ กรุณาลองใหม่");

      const results = await response.json();
      setSearchResults(results);
      if (!results.length) setLocationError("ไม่พบสถานที่นี้ ลองระบุชื่อหรือที่อยู่ใหม่");
    } catch (searchError) {
      setLocationError(searchError.message || "ไม่สามารถค้นหาตำแหน่งได้");
    } finally {
      setSearchingLocation(false);
    }
  };

  const setCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง");
      return;
    }

    setLocationLoading(true);
    setLocationError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        selectPosition(coords.latitude, coords.longitude, "ตำแหน่งปัจจุบัน");
        setLocationLoading(false);
      },
      (geoError) => {
        setLocationError(`ไม่สามารถรับตำแหน่งได้: ${geoError.message}`);
        setLocationLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.shopname || !form.email || !form.phone || !form.file) {
      setError("กรุณากรอกข้อมูลร้านค้าและเลือกรูปใบอนุญาตให้ครบถ้วน");
      return;
    }

    if (!form.latitude || !form.longitude) {
      setError("กรุณาค้นหาหรือเลือกตำแหน่งร้านค้าบนแผนที่");
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

          <section className="cs-location-section">
            <div className="cs-location-heading">
              <div>
                <h2>ตำแหน่งร้านค้า</h2>
                <p>ค้นหาที่อยู่หรือแตะบนแผนที่เพื่อวางหมุดร้าน</p>
              </div>
              <button
                type="button"
                className="cs-current-location"
                onClick={setCurrentLocation}
                disabled={locationLoading}
              >
                <FaCrosshairs />
                <span>{locationLoading ? "กำลังค้นหา..." : "ใช้ตำแหน่งปัจจุบัน"}</span>
              </button>
            </div>

            <div className="cs-location-search">
              <FaSearch />
              <input
                value={locationQuery}
                onChange={(event) => setLocationQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    searchLocation();
                  }
                }}
                placeholder="ค้นหาชื่อสถานที่หรือที่อยู่"
                aria-label="ค้นหาตำแหน่งร้านค้า"
              />
              <button
                type="button"
                onClick={searchLocation}
                disabled={searchingLocation || !locationQuery.trim()}
              >
                {searchingLocation ? "กำลังค้นหา..." : "ค้นหา"}
              </button>
            </div>

            {searchResults.length > 0 && (
              <div className="cs-location-results">
                {searchResults.map((result) => (
                  <button
                    type="button"
                    key={result.place_id}
                    onClick={() => selectPosition(
                      Number(result.lat),
                      Number(result.lon),
                      result.display_name
                    )}
                  >
                    {result.display_name}
                  </button>
                ))}
              </div>
            )}

            <MapContainer
              center={defaultMapCenter}
              zoom={12}
              scrollWheelZoom
              className="cs-map"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapViewport position={mapPosition} />
              <MapClickPicker
                onSelect={(latitude, longitude) =>
                  selectPosition(latitude, longitude, "ตำแหน่งที่เลือกบนแผนที่")
                }
              />
              {selectedPosition && (
                <Marker position={selectedPosition} icon={mapMarkerIcon}>
                  <Popup>{locationLabel}</Popup>
                </Marker>
              )}
            </MapContainer>

            {locationLabel && <p className="cs-location-label">{locationLabel}</p>}
            {locationError && <p className="cs-location-error">{locationError}</p>}

            <div className="cs-row cs-coords">
              <label>
                <span>ละติจูด</span>
                <input readOnly value={form.latitude} placeholder="เลือกตำแหน่งบนแผนที่" />
              </label>
              <label>
                <span>ลองจิจูด</span>
                <input readOnly value={form.longitude} placeholder="เลือกตำแหน่งบนแผนที่" />
              </label>
            </div>
          </section>

          <div className="cs-row">
            <span className="cs-location-hint">เลือกพิกัดร้านให้ถูกต้อง เพื่อให้ลูกค้าค้นหาร้านใกล้เคียงและตรวจสอบระยะจัดส่งได้</span>
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
