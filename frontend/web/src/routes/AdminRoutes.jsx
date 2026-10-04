import { Routes, Route } from "react-router-dom";
import LoginAdmin from "../admin/LoginAdmin/LoginAdmin";
import Dashboard from "../admin/Dashboard/Dashboard";
import SystemStats from "../admin/SystemStats/SystemStats";
import ModelEdit from "../admin/ModelEdit/ModelEdit";
import RegisteredPharmacies from "../admin/RegisteredPharmacies/RegisteredPharmacies";
import PharmacyApprovals from "../admin/PharmacyApprovals/PharmacyApprovals";
import PharmacyDetail from "../admin/PharmacyDetail/PharmacyDetail";

function AdminRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginAdmin />} />
      <Route path="/admin" element={<LoginAdmin />} />
      <Route path="/admin/dashboard" element={<Dashboard />} />
      <Route path="/admin/statistics" element={<SystemStats />} />
      <Route path="/admin/model-edit" element={<ModelEdit />} />
      <Route path="/admin/pharmacies" element={<RegisteredPharmacies />} />
      <Route path="/admin/pharmacies/:id" element={<PharmacyDetail />} />
      <Route path="/admin/pharmacy-approvals" element={<PharmacyApprovals />} />
    </Routes>
  );
}

export default AdminRoutes;
