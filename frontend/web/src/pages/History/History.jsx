import "./History.css";

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

import Topbar from "../../layouts/Topbar";
import Navbar from "../../layouts/Navbar";
import { getWoundHistory } from "../../api/wound.api";

const API_URL = import.meta.env.VITE_API_URL;

function History() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const result = await getWoundHistory();
        setHistory(result.data || []);
      } catch (requestError) {
        console.error("Load wound history error:", requestError);
        setError(
          requestError.response?.data?.error ||
          "ไม่สามารถโหลดประวัติบาดแผลได้"
        );
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";

    const [year, month, day] = String(date)
      .split("T")[0]
      .split("-")
      .map(Number);
    const localDate = new Date(year, month - 1, day);

    return localDate.toLocaleDateString("th-TH", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="page">

      {/* top */}
      <Topbar />

      <Navbar />

      {/* main */}
      <div className="history-main">
        {loading && <p className="history-status">กำลังโหลดประวัติ...</p>}

        {!loading && error && <p className="history-status error">{error}</p>}

        {!loading && !error && history.length === 0 && (
          <p className="history-status">ยังไม่มีประวัติบาดแผล</p>
        )}

        {!loading && !error && history.map((item) => (
          <Link
            to={`/result?image_id=${item.image_id}`}
            className="history-card"
            key={item.image_id}
          >
            <div className="image-box">
              <img
                src={`${API_URL}/wounds/${encodeURIComponent(item.image_path)}`}
                alt={`บาดแผลครั้งที่ ${item.image_id}`}
              />
            </div>

            <div className="history-dates">
              <p>
                <span>วันที่อัปโหลด</span>
                <strong>{formatDate(item.upload_date)}</strong>
              </p>
              <p>
                <span>วันที่เกิดบาดแผล</span>
                <strong>{item.incident_date ? formatDate(item.incident_date) : "ไม่ได้ระบุ"}</strong>
              </p>
            </div>
            {item.wound_site && <small>{item.wound_site}</small>}
            {item.latest_prediction?.predict_label && (
              <small>{item.latest_prediction.predict_label}</small>
            )}
          </Link>
        ))}

      </div>

      {/* ads */}
      <div className="ads">

        พื้นที่โฆษณา

      </div>

    </div>
  );
}

export default History;