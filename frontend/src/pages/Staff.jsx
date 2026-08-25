import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function Staff() {
  const navigate = useNavigate();

  // ==========================================
  // CURRENT USER
  // ==========================================
  const [currentUser, setCurrentUser] = useState(null);

  // ==========================================
  // BRANCHES
  // ==========================================
  const branches = [
    {
      id: 1,
      branch_name: "Babag Branch",
      location: "Babag, Lapu-Lapu City",
    },
    {
      id: 2,
      branch_name: "Marigondon Branch",
      location: "Marigondon, Lapu-Lapu City",
    },
  ];

  // ==========================================
  // SELECTED BRANCH
  // ==========================================
  const [selectedBranch, setSelectedBranch] = useState("all");

  // ==========================================
  // STAFF
  // ==========================================
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // ==========================================
  // FORM
  // ==========================================
  const [showForm, setShowForm] = useState(false);

  const [staffForm, setStaffForm] = useState({
    full_name: "",
    email: "",
    password: "",
    branch_id: 1,
  });

  const [formLoading, setFormLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ==========================================
  // LOAD CURRENT USER
  // ==========================================
  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (error) {
        console.error("Error loading current user:", error);
      }
    }
  }, []);

  // ==========================================
  // CHECK OWNER
  // ==========================================
  useEffect(() => {
    if (currentUser && currentUser.role !== "owner") {
      navigate("/dashboard");
    }
  }, [currentUser, navigate]);

  // ==========================================
  // LOAD STAFF
  // ==========================================
  const fetchStaff = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await api.get("/auth/staff", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data?.success) {
        setStaff(
          Array.isArray(response.data.staff)
            ? response.data.staff
            : []
        );
      } else {
        setStaff([]);
      }
    } catch (error) {
      console.error("Load staff error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to load staff accounts."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // ==========================================
  // LOAD STAFF WHEN OWNER IS READY
  // ==========================================
  useEffect(() => {
    if (currentUser?.role === "owner") {
      fetchStaff();
    }
  }, [currentUser]);

  // ==========================================
  // FILTER STAFF BY BRANCH
  // ==========================================
  const filteredStaff = useMemo(() => {
    if (selectedBranch === "all") {
      return staff;
    }

    return staff.filter(
      (member) =>
        Number(member.branch_id) === Number(selectedBranch)
    );
  }, [staff, selectedBranch]);

  // ==========================================
  // GET SELECTED BRANCH
  // ==========================================
  const selectedBranchData = branches.find(
    (branch) => Number(branch.id) === Number(selectedBranch)
  );

  // ==========================================
  // HANDLE FORM CHANGE
  // ==========================================
  const handleFormChange = (e) => {
    const { name, value } = e.target;

    setStaffForm((prev) => ({
      ...prev,
      [name]:
        name === "branch_id"
          ? Number(value)
          : value,
    }));
  };

  // ==========================================
  // CREATE STAFF
  // ==========================================
  const handleCreateStaff = async (e) => {
    e.preventDefault();

    setFormLoading(true);
    setMessage("");
    setError("");

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "You are not logged in. Please log in again."
        );
        return;
      }

      const response = await api.post(
        "/auth/staff",
        {
          full_name: staffForm.full_name.trim(),
          email: staffForm.email.trim().toLowerCase(),
          password: staffForm.password,
          branch_id: Number(staffForm.branch_id),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data?.success) {
        setMessage(
          "Staff account created successfully!"
        );

        setStaffForm({
          full_name: "",
          email: "",
          password: "",
          branch_id: 1,
        });

        await fetchStaff(true);

        setShowForm(false);
      }
    } catch (error) {
      console.error("Create staff error:", error);

      setError(
        error.response?.data?.message ||
          "Failed to create staff account."
      );
    } finally {
      setFormLoading(false);
    }
  };

  // ==========================================
  // FORMAT DATE
  // ==========================================
  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleDateString("en-PH", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ==========================================
  // GET BRANCH NAME
  // ==========================================
  const getBranchName = (branchId) => {
    const branch = branches.find(
      (item) => item.id === Number(branchId)
    );

    return branch?.branch_name || "Unknown Branch";
  };

  // ==========================================
  // LOGOUT
  // ==========================================
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("ownerSelectedBranch");

    navigate("/");
  };

  // ==========================================
  // LOADING SCREEN
  // ==========================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <div className="sticky top-0 h-screen self-start">
          <Sidebar />
        </div>

        <main className="flex-1 p-8">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>

              <p className="text-gray-500 mt-4">
                Loading staff...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // MAIN PAGE
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* SIDEBAR */}
      <div className="sticky top-0 h-screen self-start">
        <Sidebar />
      </div>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-x-hidden">

        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Staff Management
            </h1>

            <p className="text-gray-500 mt-1">
              Manage cashier accounts and their assigned branches.
            </p>
          </div>

          <div className="flex gap-3">

            {/* REFRESH */}
            <button
              onClick={() => fetchStaff(true)}
              disabled={refreshing}
              className="px-5 py-3 bg-white border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              {refreshing
                ? "Refreshing..."
                : "↻ Refresh"}
            </button>

            {/* ADD STAFF */}
            <button
              onClick={() => {
                setShowForm(true);
                setMessage("");
                setError("");

                setStaffForm({
                  full_name: "",
                  email: "",
                  password: "",
                  branch_id: 1,
                });
              }}
              className="px-5 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition"
            >
              + Add Staff
            </button>

          </div>
        </div>

        {/* SUCCESS MESSAGE */}
        {message && (
          <div className="mb-6 p-4 rounded-xl bg-green-50 border border-green-200 text-green-700">
            <p className="font-semibold">
              {message}
            </p>
          </div>
        )}

        {/* ERROR MESSAGE */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
            <p className="font-semibold">
              Staff Management Error
            </p>

            <p className="text-sm mt-1">
              {error}
            </p>
          </div>
        )}

        {/* ==========================================
            BRANCH FILTER
        ========================================== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Staff by Branch
              </h2>

              <p className="text-sm text-gray-500 mt-1">
                Select a branch to view the staff assigned to it.
              </p>
            </div>

            {/* BRANCH DROPDOWN */}
            <div className="w-full md:w-80">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Select Branch
              </label>

              <select
                value={selectedBranch}
                onChange={(e) =>
                  setSelectedBranch(e.target.value)
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-pink-400"
              >
                <option value="all">
                  All Branches
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* SELECTED BRANCH INFO */}
          {selectedBranch !== "all" &&
            selectedBranchData && (
              <div className="mt-5 p-4 bg-pink-50 border border-pink-100 rounded-xl">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs uppercase tracking-wide text-pink-500 font-semibold">
                      Selected Branch
                    </p>

                    <h3 className="text-xl font-bold text-gray-800 mt-1">
                      {selectedBranchData.branch_name}
                    </h3>

                    <p className="text-sm text-gray-500 mt-1">
                      {selectedBranchData.location}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-3xl font-bold text-pink-500">
                      {filteredStaff.length}
                    </p>

                    <p className="text-xs text-gray-500">
                      Staff Assigned
                    </p>
                  </div>

                </div>

              </div>
            )}
        </div>

        {/* ==========================================
            ADD STAFF FORM
        ========================================== */}
        {showForm && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">

            {/* FORM HEADER */}
            <div className="flex items-center justify-between mb-6">

              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Add Staff Account
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Create a new cashier account and assign it to a branch.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowForm(false);
                  setMessage("");
                  setError("");
                }}
                className="text-gray-500 hover:text-gray-800 text-2xl"
              >
                ✕
              </button>

            </div>

            {/* FORM */}
            <form
              onSubmit={handleCreateStaff}
              className="grid grid-cols-1 md:grid-cols-2 gap-5"
            >

              {/* FULL NAME */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name
                </label>

                <input
                  type="text"
                  name="full_name"
                  value={staffForm.full_name}
                  onChange={handleFormChange}
                  placeholder="Juan Dela Cruz"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={staffForm.email}
                  onChange={handleFormChange}
                  placeholder="staff@tasteitcafe.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* PASSWORD */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={staffForm.password}
                  onChange={handleFormChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                />
              </div>

              {/* BRANCH */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigned Branch
                </label>

                <select
                  name="branch_id"
                  value={staffForm.branch_id}
                  onChange={handleFormChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-400"
                >
                  {branches.map((branch) => (
                    <option
                      key={branch.id}
                      value={branch.id}
                    >
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* ROLE */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Role
                </label>

                <input
                  type="text"
                  value="Cashier"
                  disabled
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                />

                <p className="text-xs text-gray-500 mt-1">
                  Staff accounts are created as Cashier.
                </p>
              </div>

              {/* BUTTONS */}
              <div className="flex items-end gap-3">

                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-6 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition disabled:opacity-50"
                >
                  {formLoading
                    ? "Creating..."
                    : "Create Staff"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setMessage("");
                    setError("");
                  }}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition"
                >
                  Cancel
                </button>

              </div>

            </form>
          </div>
        )}

        {/* ==========================================
            STAFF LIST
        ========================================== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">

          {/* TABLE HEADER */}
          <div className="p-6 border-b border-gray-200">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedBranch === "all"
                    ? "All Staff Accounts"
                    : `${selectedBranchData?.branch_name} Staff`}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {selectedBranch === "all"
                    ? "All cashiers registered in Taste It Café."
                    : `Cashiers assigned to ${selectedBranchData?.branch_name}.`}
                </p>
              </div>

              <div className="px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm text-gray-500">
                  Total:
                </span>

                <span className="ml-2 font-bold text-gray-800">
                  {filteredStaff.length}
                </span>
              </div>

            </div>
          </div>

          {/* TABLE */}
          <div className="overflow-x-auto">

            {filteredStaff.length === 0 ? (

              <div className="text-center py-16 px-6">

                <div className="text-5xl mb-4">
                  👥
                </div>

                <h3 className="font-semibold text-gray-700 text-lg">
                  No staff assigned
                </h3>

                <p className="text-sm text-gray-500 mt-2">
                  {selectedBranch === "all"
                    ? 'Click "Add Staff" to create the first cashier account.'
                    : `There are currently no staff assigned to ${selectedBranchData?.branch_name}.`}
                </p>

                <button
                  onClick={() => {
                    setShowForm(true);
                    setMessage("");
                    setError("");

                    setStaffForm({
                      full_name: "",
                      email: "",
                      password: "",
                      branch_id:
                        selectedBranch === "all"
                          ? 1
                          : Number(selectedBranch),
                    });
                  }}
                  className="mt-5 px-5 py-3 bg-pink-500 text-white rounded-lg font-semibold hover:bg-pink-600 transition"
                >
                  + Add Staff
                </button>

              </div>

            ) : (

              <table className="w-full">

                <thead className="bg-gray-50">

                  <tr>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Staff
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Email
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Role
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Assigned Branch
                    </th>

                    <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                      Created
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredStaff.map((member) => (

                    <tr
                      key={member.id}
                      className="border-t hover:bg-gray-50"
                    >

                      {/* NAME */}
                      <td className="px-6 py-4">

                        <p className="font-semibold text-gray-800">
                          {member.full_name}
                        </p>

                        <p className="text-xs text-gray-500 mt-1">
                          Staff ID: {member.id}
                        </p>

                      </td>

                      {/* EMAIL */}
                      <td className="px-6 py-4 text-gray-600">
                        {member.email}
                      </td>

                      {/* ROLE */}
                      <td className="px-6 py-4">

                        <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          {member.role || "cashier"}
                        </span>

                      </td>

                      {/* BRANCH */}
                      <td className="px-6 py-4">

                        <p className="font-medium text-gray-800">
                          {member.branch_name ||
                            getBranchName(member.branch_id)}
                        </p>

                        {member.location && (
                          <p className="text-xs text-gray-500 mt-1">
                            {member.location}
                          </p>
                        )}

                      </td>

                      {/* CREATED */}
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(member.created_at)}
                      </td>

                    </tr>

                  ))}

                </tbody>

              </table>

            )}

          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-6 text-sm text-gray-400 text-center">
          Taste It Café Management System • Staff Management
        </div>

      </main>
    </div>
  );
}

export default Staff;