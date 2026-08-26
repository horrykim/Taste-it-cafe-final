import { useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // ==========================================
  // GET CURRENT USER
  // ==========================================
  const savedUser = localStorage.getItem("user");

  let currentUser = null;

  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  }

  const isOwner = currentUser?.role === "owner";

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("")
    : "TC";

  // ==========================================
  // MAIN MENU
  // ==========================================
  const menuItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
    },
    {
      name: "Menu Management",
      path: "/menu",
    },
    {
      name: "Inventory Management",
      path: "/inventory",
    },
    {
      name: "Sales",
      path: "/sales",
    },
    {
      name: "Reports",
      path: "/reports",
    },
    {
      name: "Reconciliation",
      path: "/reconciliation",
    },

    
  ];

  // ==========================================
  // OWNER MENU
  // ==========================================
  const ownerMenuItems = [
    {
      name: "Staff Management",
      path: "/staff",
    },
    {
      name: "Settings",
      path: "/settings",
    },
  ];

  const accountMenuItems = [
    {
      name: "My Profile",
      path: "/profile",
    },
  ];

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
  // RENDER
  // ==========================================
  return (
    <aside className="w-64 bg-white border-r min-h-screen flex flex-col">

      {/* ==========================================
          LOGO
      ========================================== */}
      <div className="px-6 py-6 border-b">
        <h1 className="text-2xl font-bold text-pink-500">
          Taste It Café
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Café Management System
        </p>
      </div>

      {/* ==========================================
          NAVIGATION
      ========================================== */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">

        {/* MAIN MENU */}
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3 px-3">
          Main Menu
        </p>

        <div className="space-y-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-pink-100 text-pink-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

        {/* ==========================================
            OWNER MENU
        ========================================== */}
        {isOwner && (
          <>
            <p className="text-xs font-semibold text-gray-400 uppercase mt-8 mb-3 px-3">
              Administration
            </p>

            <div className="space-y-2">
              {ownerMenuItems.map((item) => {
                const isActive = location.pathname === item.path;

                return (
                  <button
                    key={item.name}
                    onClick={() => navigate(item.path)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      isActive
                        ? "bg-pink-100 text-pink-600 font-semibold"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {item.name}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Account */}
        <p className="text-xs font-semibold text-gray-400 uppercase mt-8 mb-3 px-3">
          Account
        </p>
        <div className="space-y-2">
          {accountMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.path)}
                className={`w-full text-left px-4 py-3 rounded-lg transition ${
                  isActive
                    ? "bg-pink-100 text-pink-600 font-semibold"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {item.name}
              </button>
            );
          })}
        </div>

      </nav>

      {/* Current user mini card */}
      {currentUser && (
        <div className="mx-4 mb-3 rounded-xl border border-gray-100 bg-gray-50 p-3 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-white border flex items-center justify-center text-sm font-bold text-[#26395d] shadow-sm">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-gray-800 truncate">{currentUser.full_name || "User"}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser.email}</p>
          </div>
          <button
            onClick={() => navigate("/profile")}
            className="text-xs font-semibold text-pink-600 hover:text-pink-700"
            title="View profile"
          >
            View
          </button>
        </div>
      )}

      {/* ==========================================
           LOGOUT
      ========================================== */}
      <div className="px-4 py-5 border-t">
        <button
          onClick={handleLogout}
          className="w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition"
        >
          Log Out
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;