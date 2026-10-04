import { BrowserRouter } from "react-router-dom";
import AdminRoutes from "./AdminRoutes";
import UserRoutes from "./UserRoutes";
function AppRoutes() {
  const isAdminMode = import.meta.env.VITE_APP_MODE === "admin";

  return (
    <BrowserRouter>
      {isAdminMode ? <AdminRoutes /> : <UserRoutes />}
    </BrowserRouter>
  );
}

export default AppRoutes;
