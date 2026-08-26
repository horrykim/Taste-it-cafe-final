import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Login from "./pages/Login";
import OwnerDashboard from "./pages/OwnerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import PublicRoute from "./components/PublicRoute";
import MenuManagement from "./pages/MenuManagement";
import InventoryManagement from "./pages/InventoryManagement";
import Sales from "./pages/Sales";
import SelectBranch from "./pages/SelectBranch";
import Staff from "./pages/Staff";
import Report from "./pages/Report";
import Settings from "./pages/Settings";
import Reconciliation from "./pages/Reconciliation";
import Profile from "./pages/Profile";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ==========================================
            LOGIN - public only, redirects to /dashboard if session exists
        ========================================== */}

        <Route
          path="/"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* ==========================================
            SELECT BRANCH
        ========================================== */}

        <Route
          path="/select-branch"
          element={
            <ProtectedRoute>
              <SelectBranch />
            </ProtectedRoute>
          }
        />

<Route path="/reports" element={<Report />} />

        {/* ==========================================
            OWNER DASHBOARD
        ========================================== */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <OwnerDashboard />
            </ProtectedRoute>
          }
        />

        {/* ==========================================
            MENU MANAGEMENT
        ========================================== */}

        <Route
          path="/menu"
          element={
            <ProtectedRoute>
              <MenuManagement />
            </ProtectedRoute>
          }
        />

        {/* ==========================================
            INVENTORY MANAGEMENT
        ========================================== */}

        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <InventoryManagement />
            </ProtectedRoute>
          }
        />

        {/* ==========================================
            SALES / POS
        ========================================== */}

        <Route
          path="/sales"
          element={
            <ProtectedRoute>
              <Sales />
            </ProtectedRoute>
          }
        />

                <Route
                  path="/staff"
                  element={<Staff />}
                />
                
          <Route
              path="/settings"
              element={<Settings />}
            />

        {/* ==========================================
            RECONCILIATION
        ========================================== */}

        <Route
          path="/reconciliation"
          element={
            <ProtectedRoute>
              <Reconciliation />
            </ProtectedRoute>
          }
        />

        {/* ==========================================
            PROFILE
        ========================================== */}

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        {/* ==========================================
            UNKNOWN PAGE
        ========================================== */}

        <Route
          path="*"
          element={
            <Navigate
              to="/"
              replace
            />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;