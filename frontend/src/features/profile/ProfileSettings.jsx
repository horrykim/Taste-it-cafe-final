import { useState } from "react";
import { User, Lock, Mail, MapPin } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Button, Card, FormField, Input, Toast, Badge } from "../../components/ui";

function ProfileSettings() {
  const { currentUser, updateUser } = useAuth();
  const { currentBranch } = useBranch();
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });

  const [profileForm, setProfileForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      return notify("Full name is required.", "danger");
    }
    updateUser({ name: profileForm.name, phone: profileForm.phone });
    notify("Profile updated successfully.");
  };

  const handlePasswordUpdate = (e) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return notify("All password fields are required.", "danger");
    }

    if (newPassword.length < 6) {
      return notify("New password must be at least 6 characters.", "danger");
    }

    if (newPassword !== confirmPassword) {
      return notify("New passwords do not match.", "danger");
    }

    // Mock successful password update
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    notify("Password updated successfully.");
  };

  const initials = currentUser?.name?.split(" ").map(part => part[0]).join("").slice(0, 2) || "U";
  const roleLabel = currentUser?.role === "OWNER" ? "Owner / Manager" : "Staff";

  return (
    <div className="min-h-screen bg-[#f5f4f0] p-4 sm:p-6 xl:p-8">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Account Summary Card */}
        <Card className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-taste-purple/20 text-2xl font-bold text-taste-text">
              {initials}
            </span>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{currentUser?.name}</h2>
                <Badge variant="purple">{roleLabel}</Badge>
              </div>
              <p className="text-sm text-slate-500">{currentUser?.role === "OWNER" ? "Owner account" : "Staff account"}</p>

              <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-6">
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <Mail size={16} className="text-slate-400" />
                  {currentUser?.email || currentUser?.username || "Not provided"}
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-700">
                  <MapPin size={16} className="text-slate-400" />
                  Branch: {currentBranch?.name || "Not assigned"}
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Settings Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Edit Profile */}
          <Card className="p-4 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <User size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Edit Profile</h3>
                <p className="text-xs text-slate-500 sm:text-sm">Update your display name and contact information.</p>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-4">
              <FormField label="Full Name" required>
                <Input
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter full name"
                />
              </FormField>

              <FormField label="Email Address">
                <Input
                  value={currentUser?.email || currentUser?.username || ""}
                  readOnly
                  className="bg-slate-50 text-slate-500"
                />
                <p className="mt-1.5 text-xs text-slate-500">Your email is used for account login.</p>
              </FormField>

              <FormField label="Phone Number">
                <Input
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="+63 912 345 6789"
                />
              </FormField>

              <div className="pt-2">
                <Button type="submit" className="w-full sm:w-auto">Save Changes</Button>
              </div>
            </form>
          </Card>

          {/* Change Password */}
          <Card className="p-4 sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                <Lock size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Change Password</h3>
                <p className="text-xs text-slate-500 sm:text-sm">Keep your Taste It account secure.</p>
              </div>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <FormField label="Current Password" required>
                <Input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                  placeholder="•••••••••••••••"
                />
              </FormField>

              <FormField label="New Password" required>
                <Input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                  placeholder="Enter new password"
                />
              </FormField>

              <FormField label="Confirm New Password" required>
                <Input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
              </FormField>

              <div className="pt-2">
                <Button type="submit" className="w-full sm:w-auto">Update Password</Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
      <Toast open={toast.open} onClose={() => setToast((current) => ({ ...current, open: false }))} variant={toast.variant}>
        {toast.message}
      </Toast>
    </div>
  );
}

export default ProfileSettings;
