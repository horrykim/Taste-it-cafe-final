import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "../components/ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import AppLayout from "../layouts/AppLayout";
import BranchSelection from "../pages/BranchSelection";
import Login from "../pages/Login";
import PlaceholderPage from "../pages/PlaceholderPage";
import DesignSystemShowcase from "../pages/DesignSystemShowcase";
import OwnerDashboard from "../features/dashboard/OwnerDashboard";
import MenuManagement from "../features/menu/MenuManagement";
import InventoryManagement from "../features/inventory/InventoryManagement";
import Reconciliation from "../features/reconciliation/Reconciliation";
import POS from "../features/pos/POS";
import Sales from "../features/sales/Sales";
import BranchManagement from "../features/branches/BranchManagement";
import StaffManagement from "../features/staff/StaffManagement";
import Reports from "../features/reports/Reports";

const placeholders = {
  dashboard: ["Dashboard", "Your branch-level operational overview will be introduced in the dashboard phase."],
  pos: ["Point of Sale", "The branch-scoped transaction workflow will be implemented in the POS phase."],
  menu: ["Menu Management", "Menu, category, and recipe workflows will be introduced in their dedicated phase."],
  inventory: ["Inventory", "Branch inventory monitoring will be implemented in the inventory phase."],
  sales: ["Sales", "Sales history will be implemented with appropriate Owner and Staff visibility."],
  reports: ["Reports", "Approved sales, inventory, and reconciliation reporting will be implemented in the reports phase."],
  aiReports: ["AI Business Reports", "Weekly reporting insights will be implemented without forecasting or recommendations."],
  branches: ["Branch Management", "Branch management details will be implemented in a later approved phase."],
  staff: ["Staff Management", "Staff account management will be implemented in its dedicated phase."],
};

function placeholder([title, description], staffCapabilities) {
  return <PlaceholderPage title={title} description={description} staffCapabilities={staffCapabilities} />;
}

function DashboardRoute() {
  const { currentUser } = useAuth();
  return currentUser.role === "OWNER" ? <OwnerDashboard /> : placeholder(["Staff Dashboard", "Your assigned branch workspace will be introduced in the Staff Dashboard phase."]);
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/branches" element={<ProtectedRoute allowedRoles={["OWNER"]}><BranchSelection /></ProtectedRoute>} />
      <Route element={<ProtectedRoute requireBranchForOwner><AppLayout /></ProtectedRoute>}>
        <Route path="/app/dashboard" element={<DashboardRoute />} />
        <Route path="/app/inventory" element={<InventoryManagement />} />
        <Route path="/app/reconciliation" element={<Reconciliation />} />
        <Route path="/app/sales" element={<ProtectedRoute allowedRoles={["OWNER", "STAFF"]}><Sales /></ProtectedRoute>} />
        <Route path="/app/pos" element={<ProtectedRoute allowedRoles={["OWNER", "STAFF"]}><POS /></ProtectedRoute>} />
        <Route path="/app/menu" element={<MenuManagement />} />
        <Route path="/app/reports" element={<ProtectedRoute allowedRoles={["OWNER"]}><Reports /></ProtectedRoute>} />
        <Route path="/app/reports/ai" element={<ProtectedRoute allowedRoles={["OWNER"]}>{placeholder(placeholders.aiReports)}</ProtectedRoute>} />
        <Route path="/app/branches" element={<ProtectedRoute allowedRoles={["OWNER"]}><BranchManagement /></ProtectedRoute>} />
        <Route path="/app/staff" element={<ProtectedRoute allowedRoles={["OWNER"]}><StaffManagement /></ProtectedRoute>} />
        <Route path="/app/design-system" element={<ProtectedRoute allowedRoles={["OWNER"]}><DesignSystemShowcase /></ProtectedRoute>} />
      </Route>
      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/menu" element={<Navigate to="/app/menu" replace />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default AppRoutes;
