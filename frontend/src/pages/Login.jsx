import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();

  // ======================================================
  // SESSION: if already logged in, redirect to dashboard
  // covers direct navigation to / or /login
  // ======================================================

  useEffect(() => {
    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      localStorage.getItem("access_token");
    const userStr = localStorage.getItem("user");
    if (!token || !userStr) return;

    // quick expiry check - if expired, clear and stay on login
    try {
      const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("access_token");
        localStorage.removeItem("user");
        return;
      }
    } catch {
      // malformed token -> clear
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return;
    }

    // verify session with backend, then redirect
    let cancelled = false;
    api
      .get("/auth/me")
      .then((res) => {
        if (cancelled) return;
        if (res.data?.success) {
          navigate("/dashboard", { replace: true });
        }
      })
      .catch(() => {
        if (cancelled) return;
        // 401 -> token invalid/expired -> clear session and stay on login
        // do not clear on network error
        // interceptor will have logged warning
      });

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // ======================================================
  // LOGIN
  // ======================================================

  const handleLogin = async (e) => {
    e.preventDefault();

    setMessage("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      console.log("LOGIN RESPONSE:", response.data);

      const user = response.data.user;
      const token = response.data.token;

      // ==================================================
      // SAVE TOKEN
      // ==================================================

      localStorage.setItem("token", token);

      // ==================================================
      // SAVE USER
      // ==================================================

      localStorage.setItem("user", JSON.stringify(user));

      console.log("LOGGED IN USER:", user);

      // ==================================================
      // OWNER
      // ==================================================

      // Owner does NOT select a branch.
      // Owner goes directly to the main dashboard.

      if (user.role === "owner") {
        // Remove any old branch selection
        localStorage.removeItem("selectedBranch");
        localStorage.removeItem("selectedBranchId");
        localStorage.removeItem("selectedBranchName");
        localStorage.removeItem("branchId");
        localStorage.removeItem("branchName");

        navigate("/dashboard");
        return;
      }

      // ==================================================
      // CASHIER / BRANCH USER
      // ==================================================

      // Cashier must have an assigned branch.

      if (!user.branch_id) {
        setMessage(
          "Your account is not assigned to a branch. Please contact the administrator."
        );

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        return;
      }

      // ==================================================
      // SAVE CASHIER'S ASSIGNED BRANCH
      // ==================================================

      const assignedBranch = {
        id: Number(user.branch_id),
        branch_name: user.branch_name || "Assigned Branch",
        location: user.location || "",
      };

      localStorage.setItem(
        "selectedBranch",
        JSON.stringify(assignedBranch)
      );

      // Also save individual values for compatibility
      localStorage.setItem(
        "selectedBranchId",
        String(assignedBranch.id)
      );

      localStorage.setItem(
        "selectedBranchName",
        assignedBranch.branch_name
      );

      localStorage.setItem(
        "branchId",
        String(assignedBranch.id)
      );

      localStorage.setItem(
        "branchName",
        assignedBranch.branch_name
      );

      console.log("CASHIER ASSIGNED BRANCH:", assignedBranch);

      // ==================================================
      // GO TO DASHBOARD
      // ==================================================

      navigate("/dashboard");
    } catch (error) {
      console.error("LOGIN ERROR:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // LOGIN SCREEN
  // ======================================================

  return (
    <div className="min-h-screen flex bg-white">
      {/* ==================================================
          LEFT PANEL - BRAND
      ================================================== */}

      <div className="hidden lg:flex lg:w-1/2 items-center justify-center bg-gradient-to-b from-teal-200 to-teal-300">
        <div className="text-center px-10">
          <h1 className="text-5xl font-bold text-pink-500">
            Taste It Café
          </h1>

          <p className="mt-3 text-sm font-semibold tracking-[0.2em] text-white/90">
            CAFÉ MANAGEMENT SYSTEM
          </p>
        </div>
      </div>

      {/* ==================================================
          RIGHT PANEL - FORM
      ================================================== */}

      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center px-6 py-12 relative">
        <div className="w-full max-w-md">
          {/* HEADER */}

          <h2 className="text-4xl font-extrabold text-gray-900">
            Welcome <span className="text-pink-500">Back!</span>
          </h2>

          <div className="mt-3 mb-3 h-1 w-16 rounded-full bg-pink-500" />

          <p className="text-gray-500 mb-8">
            Sign in to your Taste It account
          </p>

          {/* FORM */}

          <form onSubmit={handleLogin}>
            {/* EMAIL */}

            <div className="mb-5 text-left">
              <label className="block mb-2 text-sm font-semibold text-gray-800">
                Username / Email <span className="text-pink-500">*</span>
              </label>

              <div className="relative">
                {/* USER ICON */}

                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>

                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-gray-800 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="mb-4 text-left">
              <label className="block mb-2 text-sm font-semibold text-gray-800">
                Password <span className="text-pink-500">*</span>
              </label>

              <div className="relative">
                {/* LOCK ICON */}

                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>

                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-11 py-3.5 text-gray-800 outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    // EYE-OFF ICON

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                      <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                  ) : (
                    // EYE ICON

                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* REMEMBER ME / FORGOT PASSWORD */}

            <div className="flex items-center justify-between mb-6">
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-pink-500 focus:ring-pink-400"
                />
                Remember Me
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-medium text-pink-500 hover:text-pink-600"
              >
                Forgot Password?
              </Link>
            </div>

            {/* SIGN IN */}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-pink-400 hover:bg-pink-500 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>

            {/* MESSAGE */}

            {message && (
              <p className="mt-4 text-red-600 text-sm text-center">
                {message}
              </p>
            )}
          </form>
        </div>

        {/* FOOTER */}

        <p className="absolute bottom-6 text-xs text-gray-400">
          © {new Date().getFullYear()} Taste It. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default Login;