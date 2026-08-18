import { Bell, ChevronDown, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { pageLabels } from "../../routes/navigation";

function Topbar({ onMenuClick }) {
  const { pathname } = useLocation();
  const { currentUser } = useAuth();
  const { branches, currentBranch, selectBranch } = useBranch();
  const pageTitle = pageLabels[pathname] ?? "Taste It";
  const initials = currentUser.name.split(" ").map((part) => part[0]).join("").slice(0, 2);

  return (
    <header className="sticky top-0 z-30 border-b border-taste-border bg-white/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onMenuClick} className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple lg:hidden" aria-label="Open navigation"><Menu size={22} /></button>
          <div className="min-w-0"><p className="truncate text-lg font-semibold tracking-tight text-taste-text sm:text-xl">{pageTitle}</p><p className="hidden text-sm text-taste-muted sm:block">{currentBranch?.name ?? "Select a branch"}</p></div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {currentUser.role === "OWNER" ? (
            <label className="hidden items-center gap-2 rounded-xl border border-taste-border bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:flex">
              <span className="h-2 w-2 rounded-full bg-taste-teal" /><span className="sr-only">Selected branch</span>
              <select value={currentBranch?.id ?? ""} onChange={(event) => selectBranch(event.target.value)} className="max-w-32 bg-transparent pr-1 outline-none" aria-label="Switch branch">
                <option value="" disabled>Select branch</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </select><ChevronDown size={15} aria-hidden="true" />
            </label>
          ) : <span className="hidden rounded-xl border border-taste-border bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:block">{currentBranch?.name}</span>}
          <button type="button" className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple" aria-label="Notifications"><Bell size={20} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-taste-purple ring-2 ring-white" /></button>
          <div className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 sm:px-2"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-taste-purple/25 text-xs font-bold text-taste-text">{initials}</span><div className="hidden text-left md:block"><p className="text-sm font-semibold text-taste-text">{currentUser.name}</p><p className="text-xs text-taste-muted">{currentUser.role === "OWNER" ? "Owner / Manager" : "Staff"}</p></div></div>
        </div>
      </div>
    </header>
  );
}

export default Topbar;
