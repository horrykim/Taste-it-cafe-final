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

      </nav>

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