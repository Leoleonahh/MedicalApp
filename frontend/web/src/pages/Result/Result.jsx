import "./Result.css";
import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";

import { FaArrowLeft, FaPhoneAlt, FaMapMarkerAlt } from "react-icons/fa";
import { MdLocalPharmacy } from "react-icons/md";
import { FiImage } from "react-icons/fi";
import { getWoundDetail } from "../../api/wound.api";
import { getHotlines } from "../../api/hotline.api";

const API_URL = import.meta.env.VITE_API_URL;

const woundReferences = {
  cut_small: [
    { name: "NHS: Cuts and grazes", url: "https://www.nhs.uk/conditions/cuts-and-grazes/" },
    { name: "MedlinePlus: Cuts and puncture wounds", url: "https://medlineplus.gov/ency/article/000043.htm" },
  ],
  cut_large: [
    { name: "MedlinePlus: Cuts and puncture wounds", url: "https://medlineplus.gov/ency/article/000043.htm" },
    { name: "NHS: Cuts and grazes", url: "https://www.nhs.uk/conditions/cuts-and-grazes/" },
    { name: "American Red Cross: Wounds", url: "https://www.redcross.org/take-a-class/resources/learn-first-aid/wounds" },
  ],
  abrasion: [
    { name: "NHS: Cuts and grazes", url: "https://www.nhs.uk/conditions/cuts-and-grazes/" },
    { name: "MedlinePlus: Cuts and puncture wounds", url: "https://medlineplus.gov/ency/article/000043.htm" },
  ],
  burn: [
    { name: "NHS: Burns and scalds", url: "https://www.nhs.uk/conditions/burns-and-scalds/" },
    { name: "ศิริราชพยาบาล: การดูแลรักษาบาดแผลไฟไหม้น้ำร้อนลวก", url: "https://www.si.mahidol.ac.th/sirirajdoctor/article_detail.aspx?ID=911" },
  ],
  bruise: [
    { name: "MedlinePlus: Bruises", url: "https://medlineplus.gov/woundsandinjuries.html" },
    { name: "American Red Cross: Wounds", url: "https://www.redcross.org/take-a-class/resources/learn-first-aid/wounds" },
  ],
};

function Result() {
  const [searchParams] = useSearchParams();
  const imageId = searchParams.get("image_id");
  const savedResult = JSON.parse(
    sessionStorage.getItem("woundUpload") || "null"
  );

  const [result, setResult] = useState(imageId ? null : savedResult);
  const [loading, setLoading] = useState(Boolean(imageId));
  const [error, setError] = useState("");
  const [hotlines, setHotlines] = useState([]);
  const [hotlineOpen, setHotlineOpen] = useState(false);
  const [hotlineLoading, setHotlineLoading] = useState(false);
  const [hotlineError, setHotlineError] = useState("");

  useEffect(() => {
    if (!imageId) {
      return;
    }

    const loadResult = async () => {
      try {
        const response = await getWoundDetail(imageId);
        setResult(response.data);
      } catch (requestError) {
        console.error("Load wound detail error:", requestError);
        setError(
          requestError.response?.data?.error ||
          "ไม่สามารถโหลดรายละเอียดบาดแผลได้"
        );
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [imageId]);

  const handleHotlineClick = async () => {
    setHotlineOpen(true);
    setHotlineError("");

    if (hotlines.length > 0) {
      return;
    }

    try {
      setHotlineLoading(true);
      const response = await getHotlines();
      setHotlines(response.data || []);
    } catch (requestError) {
      console.error("Load hotlines error:", requestError);
      setHotlineError(
        requestError.response?.data?.error ||
        requestError.response?.data?.message ||
        "ไม่สามารถโหลดข้อมูลสายด่วนได้"
      );
    } finally {
      setHotlineLoading(false);
    }
  };

  const prediction = result?.prediction;
  const recommendation = result?.recommendation;
  const isNoWound = prediction?.predict_label === "ไม่มีบาดแผล";
  const imagePath = imageId ? result?.wound?.image_path : result?.upload?.image_path;
  const woundLatitude = imageId ? result?.wound?.latitude : result?.upload?.latitude;
  const woundLongitude = imageId ? result?.wound?.longitude : result?.upload?.longitude;
  const shopLink = woundLatitude != null && woundLongitude != null
    ? `/shop/buy?latitude=${encodeURIComponent(woundLatitude)}&longitude=${encodeURIComponent(woundLongitude)}`
    : "/shop/buy";
  const medicines = recommendation?.pro_reccom
    ? recommendation.pro_reccom.split(",").map((medicine) => medicine.trim()).filter(Boolean)
    : [];
  const predictLabel = prediction?.predict_label || "";
  const isLargeCut = prediction?.length === "ยาว" && prediction?.depth === "ลึก";
  const referenceKey = predictLabel.includes("แผลฉีกขาด")
    ? isLargeCut ? "cut_large" : "cut_small"
    : predictLabel.includes("แผลถลอก")
      ? "abrasion"
      : predictLabel.includes("แผลน้ำร้อนลวก")
        ? "burn"
        : predictLabel.includes("แผลฟกช้ำ")
          ? "bruise"
          : null;
  const references = referenceKey ? woundReferences[referenceKey] : [];
  const confidence = Number(prediction?.confidence);

  return (
    <div className="result-page">

      {/* Header */}
      <header className="result-header">

        <Link to={imageId ? "/history" : "/predict"} className="result-back">
          <FaArrowLeft />
        </Link>

      </header>

      {/* Main */}
      {loading && <p className="result-status">กำลังโหลดรายละเอียดบาดแผล...</p>}

      {error && <p className="result-status error">{error}</p>}

      {!loading && !error && result && <div className="result-container">

        {/* Left */}
        <div className="result-left">

          <div className="result-photo-card">

            {imagePath ? (
              <img
                className="result-photo"
                src={`${API_URL}/wounds/${encodeURIComponent(imagePath)}`}
                alt="รูปบาดแผล"
              />
            ) : (
              <FiImage className="result-photo-icon" />
            )}

          </div>

          <div className="result-medicine-card">

            <h3>ยาที่ควรซื้อ</h3>

            <div className="medicine-list">
              {medicines.length > 0 ? (
                medicines.map((medicine) => (
                  <p key={medicine}>{medicine}</p>
                ))
              ) : (
                <p>{isNoWound ? "ไม่จำเป็นต้องใช้ยาสำหรับบาดแผล" : "ไม่มีข้อมูลยาที่แนะนำ"}</p>
              )}
            </div>

          </div>

        </div>

        {/* Right */}
        <div className="result-right">

          <div className="result-name-card">

            <div className="danger-level"></div>

            <h2>{prediction?.predict_label || "ไม่พบผลการพยากรณ์"}</h2>

            <p>
              ระดับความอันตราย : {recommendation?.risk || "ไม่ระบุ"}
            </p>
            <p>
              ความมั่นใจของโมเดล : {Number.isFinite(confidence) ? `${confidence.toFixed(2)}%` : "ไม่ระบุ"}
            </p>

          </div>

          <div className="result-detail-card">

            <h3>วิธีปฐมพยาบาลเบื้องต้น</h3>

            <div className="detail-content">
              {recommendation?.recommend_text ? (
                recommendation.recommend_text.split("\n").map((step) => (
                  <p key={step}>{step}</p>
                ))
              ) : (
                <p>{isNoWound
                  ? "ระบบประเมินว่าไม่พบบาดแผลจากภาพนี้ ผลการประเมินอาจคลาดเคลื่อนได้ หากมีอาการหรือยังกังวล ควรปรึกษาบุคลากรทางการแพทย์"
                  : "ไม่มีข้อมูลวิธีปฐมพยาบาล"}</p>
              )}
            </div>

          </div>

          {references.length > 0 && (
            <div className="result-reference-card">
              <h3>แหล่งอ้างอิง</h3>
              <ul>
                {references.map((reference) => (
                  <li key={reference.url}>
                    <a href={reference.url} target="_blank" rel="noreferrer">
                      {reference.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="result-action">

            <Link to={shopLink} className="action-card">

              <MdLocalPharmacy className="action-icon pharmacy" />

              <span>ร้านขายยา</span>

            </Link>

            <button type="button" className="action-card" onClick={handleHotlineClick}>

              <FaPhoneAlt className="action-icon phone" />

              <span>โทร 1669</span>

            </button>

            <Link to="/hospital" className="action-card">

              <FaMapMarkerAlt className="action-icon map" />

              <span>สถานพยาบาลใกล้เคียง</span>

            </Link>

          </div>

        </div>

      </div>}

      {hotlineOpen && (
        <div className="hotline-overlay" role="dialog" aria-modal="true">
          <div className="hotline-popup">
            <button
              type="button"
              className="hotline-close"
              onClick={() => setHotlineOpen(false)}
              aria-label="ปิดข้อมูลสายด่วน"
            >
              ×
            </button>
            <h2>สายด่วนฉุกเฉิน</h2>

            {hotlineLoading && <p>กำลังโหลดข้อมูล...</p>}
            {hotlineError && <p className="hotline-error">{hotlineError}</p>}

            {!hotlineLoading && !hotlineError && hotlines.map((hotline) => (
              <div className="hotline-item" key={`${hotline.name}-${hotline.phone}`}>
                <h3>{hotline.name}</h3>
                <p>{hotline.description}</p>
                <a href={`tel:${hotline.phone}`} className="hotline-call">
                  โทร {hotline.phone}
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default Result;