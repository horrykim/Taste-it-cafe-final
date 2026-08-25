import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function SelectBranch() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ==========================================
  // LOAD BRANCHES
  // ==========================================

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("Loading branches...");

      const response = await api.get("/inventory/branches");

      console.log("Branches response:", response.data);

      // Handle different possible API response formats
      if (Array.isArray(response.data)) {
        setBranches(response.data);
      } else if (Array.isArray(response.data?.branches)) {
        setBranches(response.data.branches);
      } else if (Array.isArray(response.data?.data)) {
        setBranches(response.data.data);
      } else {
        setBranches([]);
      }
    } catch (error) {
      console.error("Error loading branches:", error);

      setError(
        error.response?.data?.message ||
          "Unable to load branches."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // SELECT BRANCH
  // ==========================================

  const handleSelectBranch = (branch) => {
    console.log("=================================");
    console.log("SELECTING BRANCH");
    console.log("Branch:", branch);
    console.log("Branch ID:", branch.id);
    console.log(
      "Branch Name:",
      branch.branch_name || branch.name
    );
    console.log("=================================");

    const branchName =
      branch.branch_name ||
      branch.name ||
      `Branch ${branch.id}`;

    // ========================================
    // SAVE SELECTED BRANCH
    // ========================================

    localStorage.setItem(
      "selectedBranchId",
      String(branch.id)
    );

    localStorage.setItem(
      "selectedBranchName",
      branchName
    );

    // Also save fallback keys
    localStorage.setItem(
      "branchId",
      String(branch.id)
    );

    localStorage.setItem(
      "branchName",
      branchName
    );

    console.log(
      "Saved selectedBranchId:",
      localStorage.getItem(
        "selectedBranchId"
      )
    );

    console.log(
      "Saved selectedBranchName:",
      localStorage.getItem(
        "selectedBranchName"
      )
    );

    // ========================================
    // GO TO DASHBOARD
    // ========================================

    navigate("/dashboard");
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    localStorage.removeItem(
      "selectedBranchId"
    );

    localStorage.removeItem(
      "selectedBranchName"
    );

    localStorage.removeItem("branchId");
    localStorage.removeItem("branchName");

    navigate("/");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">

        <div className="text-center">

          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>

          <p className="text-gray-500 mt-4">
            Loading branches...
          </p>

        </div>

      </div>
    );
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="bg-white border-b border-gray-200">

        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">

          <div>

            <h1 className="text-2xl font-bold text-gray-800">
              Taste It Café
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Management System
            </p>

          </div>

          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-semibold text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition"
          >
            Logout
          </button>

        </div>

      </header>

      {/* ======================================
          MAIN
      ====================================== */}

      <main className="max-w-6xl mx-auto px-6 py-12">

        <div className="text-center mb-10">

          <div className="text-5xl mb-4">
            📍
          </div>

          <h2 className="text-3xl font-bold text-gray-800">
            Select a Branch
          </h2>

          <p className="text-gray-500 mt-2">
            Choose which Taste It Café branch
            you want to manage.
          </p>

        </div>

        {/* ======================================
            ERROR
        ====================================== */}

        {error && (
          <div className="max-w-xl mx-auto mb-8 bg-red-50 border border-red-200 rounded-xl p-5">

            <p className="font-semibold text-red-700">
              Unable to Load Branches
            </p>

            <p className="text-sm text-red-600 mt-1">
              {error}
            </p>

            <button
              onClick={fetchBranches}
              className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              Try Again
            </button>

          </div>
        )}

        {/* ======================================
            NO BRANCHES
        ====================================== */}

        {!error && branches.length === 0 && (
          <div className="max-w-xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">

            <div className="text-5xl mb-4">
              🏪
            </div>

            <h3 className="text-xl font-bold text-gray-800">
              No Branches Found
            </h3>

            <p className="text-gray-500 mt-2">
              There are currently no branches
              available.
            </p>

          </div>
        )}

        {/* ======================================
            BRANCH CARDS
        ====================================== */}

        {branches.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

            {branches.map((branch) => {

              const branchName =
                branch.branch_name ||
                branch.name ||
                `Branch ${branch.id}`;

              return (
                <button
                  key={branch.id}
                  onClick={() =>
                    handleSelectBranch(branch)
                  }
                  className="text-left bg-white rounded-2xl border border-gray-200 shadow-sm p-6 hover:border-pink-400 hover:shadow-md hover:-translate-y-1 transition-all duration-200"
                >

                  {/* ICON */}

                  <div className="w-14 h-14 bg-pink-100 rounded-xl flex items-center justify-center text-3xl mb-5">
                    🏪
                  </div>

                  {/* NAME */}

                  <h3 className="text-xl font-bold text-gray-800">
                    {branchName}
                  </h3>

                  {/* LOCATION */}

                  <p className="text-gray-500 mt-2">

                    📍{" "}

                    {branch.location ||
                      "Location not specified"}

                  </p>

                  {/* BRANCH ID */}

                  <p className="text-xs text-gray-400 mt-4">
                    Branch ID: {branch.id}
                  </p>

                  {/* SELECT */}

                  <div className="mt-5 flex items-center justify-between">

                    <span className="text-sm font-semibold text-pink-500">
                      Select Branch
                    </span>

                    <span className="text-pink-500 text-lg">
                      →
                    </span>

                  </div>

                </button>
              );
            })}

          </div>
        )}

      </main>

    </div>
  );
}

export default SelectBranch;