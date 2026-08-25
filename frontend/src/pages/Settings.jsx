import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function Settings() {
  // ======================================================
  // THEME
  // ======================================================

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("theme") === "dark";
  });

  // ======================================================
  // USER INFORMATION
  // ======================================================

  const [user, setUser] = useState(null);

  // ======================================================
  // PASSWORD FORM
  // ======================================================

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  // ======================================================
  // PASSWORD STATUS
  // ======================================================

  const [passwordLoading, setPasswordLoading] =
    useState(false);

  const [passwordMessage, setPasswordMessage] =
    useState("");

  const [passwordError, setPasswordError] =
    useState("");

  // ======================================================
  // LOAD USER
  // ======================================================

  useEffect(() => {
    loadUser();
  }, []);

  // ======================================================
  // APPLY THEME
  // ======================================================

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add(
        "dark"
      );

      localStorage.setItem(
        "theme",
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark"
      );

      localStorage.setItem(
        "theme",
        "light"
      );
    }
  }, [darkMode]);

  // ======================================================
  // GET CURRENT USER
  // ======================================================

  const loadUser = async () => {
    try {
      const response = await api.get(
        "/auth/me"
      );

      if (response.data.success) {
        setUser(response.data.user);
      }
    } catch (error) {
      console.error(
        "Failed to load user:",
        error
      );
    }
  };

  // ======================================================
  // CHANGE THEME
  // ======================================================

  const handleThemeChange = (mode) => {
    setDarkMode(mode === "dark");
  };

  // ======================================================
  // CHANGE PASSWORD
  // ======================================================

  const handleChangePassword = async (e) => {
    e.preventDefault();

    setPasswordMessage("");
    setPasswordError("");

    // ==================================================
    // VALIDATION
    // ==================================================

    if (
      !currentPassword ||
      !newPassword ||
      !confirmPassword
    ) {
      setPasswordError(
        "Please fill in all password fields."
      );

      return;
    }

    if (newPassword.length < 6) {
      setPasswordError(
        "New password must be at least 6 characters."
      );

      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError(
        "New passwords do not match."
      );

      return;
    }

    if (currentPassword === newPassword) {
      setPasswordError(
        "New password must be different from your current password."
      );

      return;
    }

    try {
      setPasswordLoading(true);

      const response = await api.put(
        "/auth/change-password",
        {
          currentPassword,
          newPassword,
        }
      );

      if (response.data.success) {
        setPasswordMessage(
          "Password changed successfully."
        );

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordError(
          response.data.message ||
            "Failed to change password."
        );
      }
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      setPasswordError(
        error.response?.data?.message ||
          "Failed to change password."
      );
    } finally {
      setPasswordLoading(false);
    }
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div
      className={`flex min-h-screen transition-colors duration-300 ${
        darkMode
          ? "bg-gray-900 text-white"
          : "bg-gray-100 text-gray-800"
      }`}
    >
      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <Sidebar />

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="flex-1 p-6 md:p-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-8">
          <h1
            className={`text-3xl font-bold ${
              darkMode
                ? "text-white"
                : "text-gray-800"
            }`}
          >
            Settings
          </h1>

          <p
            className={`mt-1 ${
              darkMode
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            Manage your account and application
            preferences.
          </p>
        </div>

        {/* ==================================================
            ACCOUNT INFORMATION
        ================================================== */}

        <div
          className={`mb-6 rounded-xl p-6 shadow-sm ${
            darkMode
              ? "bg-gray-800"
              : "bg-white"
          }`}
        >
          <h2
            className={`mb-5 text-xl font-semibold ${
              darkMode
                ? "text-white"
                : "text-gray-800"
            }`}
          >
            Account Information
          </h2>

          {user ? (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

              {/* NAME */}

              <div>
                <p
                  className={`text-sm ${
                    darkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Full Name
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    darkMode
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                >
                  {user.full_name ||
                    "N/A"}
                </p>
              </div>

              {/* EMAIL */}

              <div>
                <p
                  className={`text-sm ${
                    darkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Email
                </p>

                <p
                  className={`mt-1 font-semibold ${
                    darkMode
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                >
                  {user.email ||
                    "N/A"}
                </p>
              </div>

              {/* ROLE */}

              <div>
                <p
                  className={`text-sm ${
                    darkMode
                      ? "text-gray-400"
                      : "text-gray-500"
                  }`}
                >
                  Role
                </p>

                <p
                  className={`mt-1 font-semibold capitalize ${
                    darkMode
                      ? "text-white"
                      : "text-gray-800"
                  }`}
                >
                  {user.role ||
                    "N/A"}
                </p>
              </div>

            </div>
          ) : (
            <p
              className={
                darkMode
                  ? "text-gray-400"
                  : "text-gray-500"
              }
            >
              Loading account information...
            </p>
          )}
        </div>

        {/* ==================================================
            APPEARANCE
        ================================================== */}

        <div
          className={`mb-6 rounded-xl p-6 shadow-sm ${
            darkMode
              ? "bg-gray-800"
              : "bg-white"
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              darkMode
                ? "text-white"
                : "text-gray-800"
            }`}
          >
            Appearance
          </h2>

          <p
            className={`mt-1 mb-5 text-sm ${
              darkMode
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            Choose how Taste It Café looks on
            your screen.
          </p>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* ==================================================
                LIGHT MODE
            ================================================== */}

            <button
              onClick={() =>
                handleThemeChange("light")
              }
              className={`rounded-xl border-2 p-5 text-left transition ${
                !darkMode
                  ? "border-blue-500 bg-blue-50"
                  : darkMode
                  ? "border-gray-700 bg-gray-800"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 text-2xl">
                  ☀️
                </div>

                <div>
                  <h3
                    className={`font-semibold ${
                      darkMode
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    Light Mode
                  </h3>

                  <p
                    className={`text-sm ${
                      darkMode
                        ? "text-gray-400"
                        : "text-gray-500"
                    }`}
                  >
                    Use the light appearance.
                  </p>
                </div>

              </div>

              {darkMode === false && (
                <div className="mt-4 text-sm font-semibold text-blue-600">
                  ✓ Currently Selected
                </div>
              )}
            </button>

            {/* ==================================================
                DARK MODE
            ================================================== */}

            <button
              onClick={() =>
                handleThemeChange("dark")
              }
              className={`rounded-xl border-2 p-5 text-left transition ${
                darkMode
                  ? "border-blue-500 bg-gray-700"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-700 text-2xl">
                  🌙
                </div>

                <div>
                  <h3
                    className={`font-semibold ${
                      darkMode
                        ? "text-white"
                        : "text-gray-800"
                    }`}
                  >
                    Dark Mode
                  </h3>

                  <p
                    className={`text-sm ${
                      darkMode
                        ? "text-gray-300"
                        : "text-gray-500"
                    }`}
                  >
                    Use the dark appearance.
                  </p>
                </div>

              </div>

              {darkMode && (
                <div className="mt-4 text-sm font-semibold text-blue-400">
                  ✓ Currently Selected
                </div>
              )}
            </button>

          </div>
        </div>

        {/* ==================================================
            CHANGE PASSWORD
        ================================================== */}

        <div
          className={`rounded-xl p-6 shadow-sm ${
            darkMode
              ? "bg-gray-800"
              : "bg-white"
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              darkMode
                ? "text-white"
                : "text-gray-800"
            }`}
          >
            Change Password
          </h2>

          <p
            className={`mt-1 mb-6 text-sm ${
              darkMode
                ? "text-gray-400"
                : "text-gray-500"
            }`}
          >
            Update the password for your account.
          </p>

          {/* ==================================================
              SUCCESS MESSAGE
          ================================================== */}

          {passwordMessage && (
            <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
              {passwordMessage}
            </div>
          )}

          {/* ==================================================
              ERROR MESSAGE
          ================================================== */}

          {passwordError && (
            <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {passwordError}
            </div>
          )}

          <form
            onSubmit={handleChangePassword}
            className="max-w-xl space-y-5"
          >

            {/* CURRENT PASSWORD */}

            <div>
              <label
                className={`mb-2 block text-sm font-medium ${
                  darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                Current Password
              </label>

              <input
                type="password"
                value={currentPassword}
                onChange={(e) =>
                  setCurrentPassword(
                    e.target.value
                  )
                }
                placeholder="Enter current password"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                    : "border-gray-300 bg-white text-gray-800 focus:border-blue-500"
                }`}
              />
            </div>

            {/* NEW PASSWORD */}

            <div>
              <label
                className={`mb-2 block text-sm font-medium ${
                  darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                New Password
              </label>

              <input
                type="password"
                value={newPassword}
                onChange={(e) =>
                  setNewPassword(
                    e.target.value
                  )
                }
                placeholder="Enter new password"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                    : "border-gray-300 bg-white text-gray-800 focus:border-blue-500"
                }`}
              />

              <p
                className={`mt-1 text-xs ${
                  darkMode
                    ? "text-gray-400"
                    : "text-gray-500"
                }`}
              >
                Password must be at least 6
                characters.
              </p>
            </div>

            {/* CONFIRM PASSWORD */}

            <div>
              <label
                className={`mb-2 block text-sm font-medium ${
                  darkMode
                    ? "text-gray-300"
                    : "text-gray-700"
                }`}
              >
                Confirm New Password
              </label>

              <input
                type="password"
                value={confirmPassword}
                onChange={(e) =>
                  setConfirmPassword(
                    e.target.value
                  )
                }
                placeholder="Confirm new password"
                className={`w-full rounded-lg border px-4 py-3 outline-none transition ${
                  darkMode
                    ? "border-gray-600 bg-gray-700 text-white placeholder-gray-400 focus:border-blue-500"
                    : "border-gray-300 bg-white text-gray-800 focus:border-blue-500"
                }`}
              />
            </div>

            {/* ==================================================
                CHANGE PASSWORD BUTTON
            ================================================== */}

            <button
              type="submit"
              disabled={passwordLoading}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {passwordLoading
                ? "Changing Password..."
                : "Change Password"}
            </button>

          </form>
        </div>

      </main>
    </div>
  );
}

export default Settings;