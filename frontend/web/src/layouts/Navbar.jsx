import { Link } from "react-router-dom";
import { FaUserCircle } from "react-icons/fa";
import "./Navbar.css";

function Navbar({ shopLabel = "ซื้อยา/อุปกรณ์ปฐมพยาบาล" }) {

  // ===============================
  // ดึงข้อมูล User ที่เก็บไว้ตอน Login
  // ===============================

  const user = JSON.parse(
    localStorage.getItem("user") || "null"
  );

  return (
    <nav className="shared-navbar">

      <div className="shared-navbar-inner">

        <div className="shared-menu">

          <Link to="/home">
            หน้าหลัก
          </Link>

          <Link to="/history">
            ประวัติบาดแผล
          </Link>

          <Link to="/shop/buy">
            {shopLabel}
          </Link>

        </div>


        <div className="shared-rightside">

          <Link
            to="/hospital"
            className="shared-map-circle"
            aria-label="โรงพยาบาลใกล้เคียง"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/854/854878.png"
              alt=""
            />
          </Link>


          <Link
            to="/profile"
            className="shared-profile-circle"
            aria-label="โปรไฟล์"
          >
            <FaUserCircle className="shared-profile-icon" />
          </Link>


          {/* Username */}

          {user && (
            <span className="navbar-username">
              {user.username}
            </span>
          )}

        </div>

      </div>

    </nav>
  );
}

export default Navbar;