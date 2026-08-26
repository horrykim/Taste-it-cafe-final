import { useEffect, useState, useRef, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const AVATAR_COLORS = [
  { id: "pink", label: "Pink", bg: "bg-pink-500", light: "bg-pink-100", hex: "#ec4899" },
  { id: "purple", label: "Purple", bg: "bg-purple-500", light: "bg-purple-100", hex: "#a855f7" },
  { id: "blue", label: "Blue", bg: "bg-blue-500", light: "bg-blue-100", hex: "#3b82f6" },
  { id: "emerald", label: "Emerald", bg: "bg-emerald-500", light: "bg-emerald-100", hex: "#10b981" },
  { id: "amber", label: "Amber", bg: "bg-amber-500", light: "bg-amber-100", hex: "#f59e0b" },
  { id: "rose", label: "Rose", bg: "bg-rose-500", light: "bg-rose-100", hex: "#f43f5e" },
  { id: "indigo", label: "Indigo", bg: "bg-indigo-500", light: "bg-indigo-100", hex: "#6366f1" },
  { id: "teal", label: "Teal", bg: "bg-teal-500", light: "bg-teal-100", hex: "#14b8a6" },
];

function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // draft fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarColor, setAvatarColor] = useState("pink");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  const [original, setOriginal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  // password fields
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const fileRef = useRef(null);

  const loadUser = async () => {
    try {
      setLoading(true);
      const res = await api.get("/auth/me");
      if (res.data.success) {
        const u = res.data.user;
        setUser(u);
        const draft = {
          fullName: u.full_name || "",
          email: u.email || "",
          phone: u.phone || "",
          avatarColor: u.avatar_color || "pink",
          avatarUrl: u.avatar_url || null,
        };
        setFullName(draft.fullName);
        setEmail(draft.email);
        setPhone(draft.phone);
        setAvatarColor(draft.avatarColor);
        setAvatarUrl(draft.avatarUrl);
        setAvatarPreview(draft.avatarUrl);
        setOriginal(draft);
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...stored, ...u }));
        } catch {}
      }
    } catch (e) {
      console.error("load profile", e);
      setErr(e.response?.data?.message || "Failed to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUser(); }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");
  };

  const colorMeta = useMemo(() => AVATAR_COLORS.find((c) => c.id === avatarColor) || AVATAR_COLORS[0], [avatarColor]);

  const roleBadge = (role) => {
    const r = String(role || "").toLowerCase();
    if (r === "owner") return "bg-purple-100 text-purple-700 border-purple-200";
    if (r === "admin") return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const hasChanges = useMemo(() => {
    if (!original) return false;
    return (
      fullName !== original.fullName ||
      email !== original.email ||
      phone !== original.phone ||
      avatarColor !== original.avatarColor ||
      avatarUrl !== original.avatarUrl
    );
  }, [fullName, email, phone, avatarColor, avatarUrl, original]);

  const validate = () => {
    const e = {};
    const n = fullName.trim();
    const m = email.trim();
    const p = phone.trim();
    if (!n || n.length < 2) e.fullName = "Full name must be at least 2 characters.";
    else if (n.length > 80) e.fullName = "Full name must be 2-80 characters.";
    if (!m) e.email = "Email is required.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m)) e.email = "Enter a valid email.";
    if (p && !/^[0-9+\-() ]{7,20}$/.test(p)) e.phone = "Phone 7-20 chars, digits + - ( ) space.";
    if (avatarUrl && avatarUrl.length > 5000) e.avatarUrl = "Image too large, pick smaller.";
    setFieldErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCancel = () => {
    if (!original) return;
    setFullName(original.fullName);
    setEmail(original.email);
    setPhone(original.phone);
    setAvatarColor(original.avatarColor);
    setAvatarUrl(original.avatarUrl);
    setAvatarPreview(original.avatarUrl);
    setFieldErrors({});
    setIsEditing(false);
    setErr(""); setMsg("");
  };

  const handleAvatarFile = (file) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setFieldErrors((p) => ({ ...p, avatarUrl: "Image must be < 2MB." })); return; }
    if (!file.type.startsWith("image/")) { setFieldErrors((p) => ({ ...p, avatarUrl: "Only images allowed." })); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarUrl(dataUrl);
      setAvatarPreview(dataUrl);
      setFieldErrors((p) => ({ ...p, avatarUrl: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setMsg(""); setErr("");
    if (!validate()) return;
    if (!hasChanges) { setErr("No changes to save."); return; }
    try {
      setSaving(true);
      const res = await api.put("/auth/profile", {
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        avatar_url: avatarUrl || null,
        avatar_color: avatarColor,
      });
      if (res.data.success) {
        setMsg(res.data.message || "Profile updated.");
        const updated = res.data.user;
        setUser((prev) => ({ ...prev, ...updated }));
        const draft = {
          fullName: updated.full_name || "",
          email: updated.email || "",
          phone: updated.phone || "",
          avatarColor: updated.avatar_color || avatarColor,
          avatarUrl: updated.avatar_url || null,
        };
        setOriginal(draft);
        setAvatarPreview(updated.avatar_url || null);
        try {
          const stored = JSON.parse(localStorage.getItem("user") || "{}");
          localStorage.setItem("user", JSON.stringify({ ...stored, ...updated }));
        } catch {}
        setIsEditing(false);
        setFieldErrors({});
      }
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to update profile.");
    } finally {
      setSaving(false);
      setTimeout(() => setMsg(""), 3500);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setPwMsg(""); setPwErr("");
    if (!currentPassword || !newPassword || !confirmPassword) { setPwErr("Fill in all password fields."); return; }
    if (newPassword.length < 6) { setPwErr("New password must be at least 6 characters."); return; }
    if (newPassword !== confirmPassword) { setPwErr("New passwords do not match."); return; }
    if (currentPassword === newPassword) { setPwErr("New password must be different."); return; }
    try {
      setPwLoading(true);
      const res = await api.put("/auth/change-password", { currentPassword, newPassword });
      if (res.data.success) {
        setPwMsg("Password changed successfully.");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      } else setPwErr(res.data.message || "Failed to change password.");
    } catch (e) {
      setPwErr(e.response?.data?.message || "Failed to change password.");
    } finally {
      setPwLoading(false);
      setTimeout(() => setPwMsg(""), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf7f8] flex">
        <div className="sticky top-0 h-screen self-start"><Sidebar /></div>
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading profile...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f8] flex">
      <div className="sticky top-0 h-screen self-start"><Sidebar /></div>
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-[#26395d]">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your personal information and security.</p>
          </div>
          {!isEditing ? (
            <button onClick={() => setIsEditing(true)} className="rounded-xl bg-[#26395d] px-6 py-3 text-sm font-semibold text-white hover:bg-black transition">✎ Edit Profile</button>
          ) : (
            <span className="text-sm text-amber-600 font-medium bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">Editing mode — changes not saved yet</span>
          )}
        </div>

        {msg && <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-green-700 text-sm">✓ {msg}</div>}
        {err && <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-red-700 text-sm">⚠ {err}</div>}

        {/* HERO */}
        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden mb-6">
          <div className="h-28 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400"></div>
          <div className="px-6 md:px-8 pb-6">
            <div className="flex flex-col md:flex-row md:items-end gap-5 -mt-10">
              <div className="relative group">
                <div className={`h-20 w-20 rounded-2xl border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-white overflow-hidden ${avatarPreview ? "bg-white" : colorMeta.bg}`}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    getInitials(isEditing ? fullName : user?.full_name)
                  )}
                </div>
                {isEditing && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="absolute -bottom-2 -right-2 bg-white border border-gray-200 rounded-full p-1.5 shadow hover:bg-gray-50 text-xs"
                    title="Upload avatar"
                  >
                    📷
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleAvatarFile(e.target.files?.[0])} />
              </div>
              <div className="flex-1 pb-1">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-2xl font-bold text-[#26395d]">{user?.full_name || "—"}</h2>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold capitalize ${roleBadge(user?.role)}`}>{user?.role || "user"}</span>
                  {user?.branch_name && <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">📍 {user.branch_name}</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{user?.email} {phone ? `• ${phone}` : ""}</p>
                {user?.location && <p className="text-xs text-gray-400">{user.location}</p>}
              </div>
              <div className="text-sm text-gray-500 text-right">
                <p className="text-xs uppercase tracking-wide font-semibold text-gray-400">Member ID</p>
                <p className="font-mono font-semibold text-gray-700">#{String(user?.id || "").padStart(4, "0")}</p>
                {user?.created_at && <p className="text-xs text-gray-400 mt-1">Since {new Date(user.created_at).toLocaleDateString()}</p>}
                {user?.updated_at && <p className="text-xs text-gray-400">Updated {new Date(user.updated_at).toLocaleDateString()}</p>}
              </div>
            </div>

            {isEditing && (
              <div className="mt-5 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Avatar Color & Image</p>
                <div className="flex flex-wrap items-center gap-2">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setAvatarColor(c.id)}
                      className={`h-8 w-8 rounded-full border-2 transition ${c.bg} ${avatarColor === c.id ? "border-gray-800 scale-110" : "border-white shadow"}`}
                      title={c.label}
                    />
                  ))}
                  <span className="text-xs text-gray-500 ml-2">Pick a color for initials when no image</span>
                  <button type="button" onClick={() => fileRef.current?.click()} className="ml-auto rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold hover:bg-gray-50">Upload Image</button>
                  {avatarPreview && <button type="button" onClick={() => { setAvatarUrl(null); setAvatarPreview(null); }} className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100">Remove Image</button>}
                </div>
                {fieldErrors.avatarUrl && <p className="text-xs text-red-600 mt-2">{fieldErrors.avatarUrl}</p>}
                <p className="text-xs text-gray-400 mt-2">Image &lt; 2MB. Stored as data URL. Color applies to initials.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Branch</p>
                <p className="font-semibold text-gray-800 mt-1">{user?.branch_name || "No branch assigned"}</p>
                <p className="text-xs text-gray-500">{user?.location || (user?.role === "owner" ? "Owner — all branches" : "")}</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Email</p>
                <p className="font-semibold text-gray-800 mt-1 truncate">{user?.email}</p>
                <p className="text-xs text-gray-500">Primary contact</p>
              </div>
              <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                <p className="text-xs font-semibold text-gray-400 uppercase">Role</p>
                <p className="font-semibold text-gray-800 mt-1 capitalize">{user?.role}</p>
                <p className="text-xs text-gray-500">{user?.role === "owner" ? "Full access" : "Branch access"}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          {/* EDIT PROFILE */}
          <div className="xl:col-span-3 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-7">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-[#26395d]">Edit Profile</h3>
                <p className="text-sm text-gray-500">Update your display name, email and phone.</p>
              </div>
              {isEditing && hasChanges && <span className="text-xs font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2.5 py-1 rounded-full">Unsaved changes</span>}
            </div>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                <input
                  value={fullName}
                  onChange={(e) => { setFullName(e.target.value); if (fieldErrors.fullName) setFieldErrors((p) => ({ ...p, fullName: undefined })); }}
                  placeholder="Juan Dela Cruz"
                  disabled={!isEditing}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${!isEditing ? "bg-gray-50 border-gray-200 text-gray-700" : "bg-white border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"} ${fieldErrors.fullName ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""}`}
                />
                {fieldErrors.fullName && <p className="text-xs text-red-600 mt-1">{fieldErrors.fullName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); if (fieldErrors.email) setFieldErrors((p) => ({ ...p, email: undefined })); }}
                  placeholder="you@example.com"
                  disabled={!isEditing}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${!isEditing ? "bg-gray-50 border-gray-200 text-gray-700" : "bg-white border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"} ${fieldErrors.email ? "border-red-300" : ""}`}
                />
                {fieldErrors.email ? <p className="text-xs text-red-600 mt-1">{fieldErrors.email}</p> : <p className="text-xs text-gray-400 mt-1">We’ll use this for login and notifications.</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone <span className="text-gray-400 font-normal">(optional)</span></label>
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); if (fieldErrors.phone) setFieldErrors((p) => ({ ...p, phone: undefined })); }}
                  placeholder="+63 912 345 6789"
                  disabled={!isEditing}
                  className={`w-full rounded-xl border px-4 py-3 text-sm outline-none transition ${!isEditing ? "bg-gray-50 border-gray-200 text-gray-700" : "bg-white border-gray-200 focus:border-pink-400 focus:ring-2 focus:ring-pink-100"} ${fieldErrors.phone ? "border-red-300" : ""}`}
                />
                {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
              </div>

              <div className="rounded-xl bg-[#faf7f8] border border-gray-100 px-4 py-3 flex flex-wrap gap-4 text-sm">
                <span className="text-gray-600"><span className="font-semibold text-gray-800">Branch:</span> {user?.branch_name || "—"} {user?.location ? `• ${user.location}` : ""}</span>
                <span className="text-gray-600"><span className="font-semibold text-gray-800">ID:</span> {user?.id}</span>
                <span className="text-gray-600"><span className="font-semibold text-gray-800">Role:</span> {user?.role}</span>
              </div>

              {isEditing ? (
                <div className="flex gap-3">
                  <button type="submit" disabled={saving || !hasChanges} className="rounded-xl bg-[#26395d] px-6 py-3 text-sm font-semibold text-white hover:bg-black disabled:opacity-50 disabled:cursor-not-allowed transition">
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                  <button type="button" onClick={handleCancel} disabled={saving} className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancel</button>
                  <button type="button" onClick={loadUser} disabled={saving} className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 hover:bg-gray-50 ml-auto">↻ Reload</button>
                </div>
              ) : (
                <div className="flex gap-3">
                  <button type="button" onClick={() => setIsEditing(true)} className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">Enable Editing</button>
                  <span className="text-xs text-gray-400 self-center">Click Edit Profile to make changes</span>
                </div>
              )}
            </form>
          </div>

          {/* CHANGE PASSWORD */}
          <div className="xl:col-span-2 rounded-2xl border border-gray-100 bg-white shadow-sm p-6 md:p-7">
            <h3 className="text-lg font-bold text-[#26395d]">Change Password</h3>
            <p className="text-sm text-gray-500 mb-6">Keep your account secure.</p>
            {pwMsg && <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{pwMsg}</div>}
            {pwErr && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{pwErr}</div>}
            <form onSubmit={handlePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 6 characters" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Repeat new password" className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
              </div>
              <button type="submit" disabled={pwLoading} className="w-full rounded-xl bg-pink-500 px-6 py-3 text-sm font-semibold text-white hover:bg-pink-600 disabled:opacity-50 transition">
                {pwLoading ? "Updating..." : "Update Password"}
              </button>
              <p className="text-xs text-gray-400 text-center">Password must be different from current.</p>
            </form>
            <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <p className="text-xs font-semibold text-amber-800">Tip</p>
              <p className="text-xs text-amber-700 mt-1">Use a strong password you don’t use elsewhere. You’ll stay logged in after changing.</p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">Taste It Café • Profile • Your data is only visible to you and the owner</p>
      </main>
    </div>
  );
}

export default Profile;
