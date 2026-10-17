import { FaArrowLeft, FaUserCircle } from "react-icons/fa";
import "./AdminProfileLink.css";

const profileUrl = import.meta.env.VITE_USER_APP_URL
  ? new URL("/profile", import.meta.env.VITE_USER_APP_URL).toString()
  : import.meta.env.DEV
    ? `${window.location.protocol}//${window.location.hostname}:4173/profile`
    : "/profile";

function AdminProfileLink() {
  return (
    <a className="admin-profile-link" href={profileUrl}>
      <FaUserCircle />
      <span>กลับไปหน้าโปรไฟล์</span>
      <FaArrowLeft className="admin-profile-link-arrow" />
    </a>
  );
}

export default AdminProfileLink;