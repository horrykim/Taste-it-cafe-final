import { LogOut, X } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { navigationByRole } from "../../routes/navigation";
import { useBranch } from "../../context/BranchContext";

function Sidebar({ open, onClose }) {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { clearBranch } = useBranch();
  const navigation = navigationByRole[currentUser.role] ?? [];

  const handleLogout = () => {
    clearBranch();
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {open && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-slate-900/25 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-taste-border bg-white shadow-xl transition-transform duration-200 lg:static lg:z-auto lg:translate-x-0 lg:shadow-none ${open ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-20 items-center justify-between border-b border-taste-border px-6">
          <button type="button" onClick={() => navigate("/app/dashboard")} className="text-left">
            <span className="block text-xl font-bold tracking-tight text-taste-text">Taste It</span>
            <span className="mt-0.5 block text-xs text-taste-muted">Inventory & Sales</span>
          </button>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-taste-muted transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple lg:hidden" aria-label="Close sidebar"><X size={20} /></button>
        </div>
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-taste-muted">Main menu</p>
          <div className="space-y-1">
            {navigation.map(({ icon: Icon, label, path }) => (
              <NavLink key={path} to={path} onClick={onClose} end={path === "/app/dashboard"} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple ${isActive ? "bg-taste-teal/30 text-taste-text" : "text-slate-600 hover:bg-slate-50 hover:text-taste-text"}`}>
                <Icon size={19} strokeWidth={1.9} /><span>{label}</span>
              </NavLink>
            ))}
          </div>
        </nav>
        <div className="border-t border-taste-border p-4">
          <button type="button" onClick={handleLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 transition hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple"><LogOut size={19} /><span>Log out</span></button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
