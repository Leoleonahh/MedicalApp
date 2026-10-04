import "./Home.css";

import { Link } from "react-router-dom";

import { FiCamera } from "react-icons/fi";
import Topbar from "../../layouts/Topbar";
import Navbar from "../../layouts/Navbar";

function Home() {
  return (
    <div className="page">

      {/* top */}
      <Topbar />


      <Navbar shopLabel="ซื้อยา/อุปกรณ์ปฐมพยาบาล" />

      {/* main */}
      <div className="main">

        {/* camera */}
        <Link
          to="/predict"
          className="camera-box"
        >

          <FiCamera className="camera-icon" />

          <p>กดถ่ายหรือแนบรูป</p>

        </Link>

      </div>

      {/* ads */}
      <div className="ads">
        พื้นที่โฆษณา
      </div>

    </div>
  );
}

export default Home;