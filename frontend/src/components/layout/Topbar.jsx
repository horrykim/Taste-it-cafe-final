import { Bell, CalendarDays, Menu } from "lucide-react";
import { LogOut, Settings } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { pageLabels } from "../../routes/navigation";
import { Button, ContextualPopover } from "../ui";
import { useOverlay } from "../../context/useOverlay";

const initialNotifications = [
  { id: "low-stock", title: "Low Stock Alert", message: "Egg inventory has reached the configured low-stock threshold.", timestamp: "10 minutes ago", read: false },
  { id: "transaction", title: "New Transaction", message: "A new sale was recorded at the selected branch.", timestamp: "25 minutes ago", read: false },
  { id: "reconciliation", title: "Inventory Reconciliation", message: "A reconciliation requires attention.", timestamp: "1 hour ago", read: true },
];

function Topbar({ onMenuClick }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { currentUser, logout } = useAuth();
  const { branches, currentBranch, selectBranch, clearBranch } = useBranch();
  const [selectedDate, setSelectedDate] = useState("2025-05-20");
  const [notifications, setNotifications] = useState(initialNotifications);
  const { activeOverlay, setActiveOverlay } = useOverlay();
  const branchTriggerRef = useRef(null);
  const calendarTriggerRef = useRef(null);
  const notificationTriggerRef = useRef(null);
  const profileTriggerRef = useRef(null);
  const pageTitle = pathname === "/app/dashboard" && currentUser.role === "OWNER" ? "Owner Dashboard" : pageLabels[pathname] ?? "Taste It";
  const initials = currentUser.name.split(" ").map((part) => part[0]).join("").slice(0, 2);
  const unreadCount = notifications.filter((notification) => !notification.read).length;
  const toggleOverlay = (overlay) => setActiveOverlay((current) => current === overlay ? null : overlay);
  const markNotificationRead = (notificationId) => setNotifications((current) => current.map((notification) => notification.id === notificationId ? { ...notification, read: true } : notification));
  const handleLogout = () => { clearBranch(); logout(); navigate("/login", { replace: true }); };

  return (
    <header className="sticky top-0 z-30 border-b border-taste-border bg-white/95 backdrop-blur">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button type="button" onClick={onMenuClick} className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple lg:hidden" aria-label="Open navigation"><Menu size={22} /></button>
          <div className="min-w-0"><p className="truncate text-lg font-semibold tracking-tight text-taste-text sm:text-xl">{pageTitle}</p><p className="hidden text-sm text-taste-muted sm:block">{currentBranch?.name ?? "Select a branch"}</p></div>
        </div>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {currentUser.role === "OWNER" ? (
            <>
              <button ref={calendarTriggerRef} type="button" onClick={() => toggleOverlay("calendar")} className="hidden items-center gap-2 rounded-xl border border-taste-border bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-taste-purple/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple sm:flex" aria-expanded={activeOverlay === "calendar"} aria-label="Select dashboard date">
                <CalendarDays size={16} className="text-slate-500" />
                <span>{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(`${selectedDate}T00:00:00`))}</span>
              </button>
              <button ref={branchTriggerRef} type="button" onClick={() => toggleOverlay("branch")} className="hidden cursor-pointer items-center gap-2 rounded-xl border border-taste-border bg-taste-teal-soft/35 px-3 py-2 text-sm font-medium text-taste-text shadow-sm transition hover:border-taste-purple/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:ring-2 focus-visible:ring-taste-purple/20 sm:flex" aria-expanded={activeOverlay === "branch"} aria-label="Select branch">
                <span className="h-2 w-2 shrink-0 rounded-full bg-taste-teal" />
                <span>{currentBranch?.name ?? "Select branch"}</span>
                <span className="text-xs text-taste-muted" aria-hidden="true">▼</span>
              </button>
            </>
          ) : <span className="hidden rounded-xl border border-taste-border bg-white px-3 py-2 text-sm font-medium text-slate-700 sm:block">{currentBranch?.name}</span>}
          <button ref={notificationTriggerRef} type="button" onClick={() => toggleOverlay("notifications")} className="relative rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple" aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`} aria-expanded={activeOverlay === "notifications"}>
            <Bell size={20} />
            {unreadCount > 0 && <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-taste-purple ring-2 ring-white" aria-label={`${unreadCount} unread notifications`} />}
          </button>
          <button ref={profileTriggerRef} type="button" onClick={() => toggleOverlay("profile")} className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 text-left transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple sm:px-2" aria-label="Open profile" aria-expanded={activeOverlay === "profile"}>
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-taste-purple/25 text-xs font-bold text-taste-text">{initials}</span><span className="hidden md:block"><span className="block text-sm font-semibold text-taste-text">{currentUser.name}</span><span className="block text-xs text-taste-muted">{currentUser.role === "OWNER" ? "Owner / Manager" : "Staff"}</span></span>
          </button>
        </div>
      </div>

      <ContextualPopover open={activeOverlay === "notifications"} anchorRef={notificationTriggerRef} onClose={() => setActiveOverlay(null)} width={390}>
        <div className="flex items-center justify-between gap-3 border-b border-taste-border pb-4">
          <h2 className="text-lg font-semibold text-slate-900">Notifications</h2>
          <p className="text-sm text-slate-500">{unreadCount ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up."}</p>
          {unreadCount > 0 && <Button variant="ghost" size="sm" onClick={() => setNotifications((current) => current.map((notification) => ({ ...notification, read: true })))}>Mark all as read</Button>}
        </div>
        <div className="mt-4 space-y-3">
          {notifications.length ? notifications.map((notification) => <button key={notification.id} type="button" onClick={() => markNotificationRead(notification.id)} className={`flex w-full items-start gap-3 rounded-xl border p-3 text-left transition hover:border-taste-purple/40 hover:bg-taste-purple-soft/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple ${notification.read ? "border-taste-border bg-white" : "border-taste-purple/30 bg-taste-purple-soft/35"}`}>
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${notification.read ? "bg-transparent" : "bg-taste-purple"}`} aria-hidden="true" />
            <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-slate-900">{notification.title}</span><span className="mt-1 block text-sm leading-5 text-slate-600">{notification.message}</span><span className="mt-2 block text-xs text-slate-400">{notification.timestamp}</span></span>
          </button>) : <div className="rounded-xl border border-dashed border-taste-border p-6 text-center"><Bell size={24} className="mx-auto text-slate-400" /><p className="mt-3 text-sm font-semibold text-slate-900">You're all caught up.</p></div>}
        </div>
      </ContextualPopover>

      <ContextualPopover open={activeOverlay === "profile"} anchorRef={profileTriggerRef} onClose={() => setActiveOverlay(null)} width={280}>
        <div className="flex items-center gap-3 p-2">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-taste-purple/25 text-sm font-bold text-taste-text">{initials}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-slate-900">{currentUser.name}</p>
            <p className="truncate text-xs text-slate-500">{currentUser.role === "OWNER" ? "Owner / Manager" : "Staff"}</p>
          </div>
        </div>
        
        <div className="my-2 border-t border-taste-border" />
        
        <div className="flex flex-col p-1">
          <button type="button" onClick={() => { setActiveOverlay(null); navigate("/app/profile-settings"); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-taste-purple">
            <Settings size={16} className="text-slate-400" />
            Profile Settings
          </button>
          
          <div className="my-1 border-t border-taste-border/50 mx-2" />
          
          <button type="button" onClick={() => { setActiveOverlay(null); handleLogout(); }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-500">
            <LogOut size={16} className="text-rose-500" />
            Log Out
          </button>
        </div>
      </ContextualPopover>

      <ContextualPopover open={activeOverlay === "branch"} anchorRef={branchTriggerRef} onClose={() => setActiveOverlay(null)} width={190}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Select branch</h2>
        <div className="space-y-1">{branches.map((branch) => <button key={branch.id} type="button" onClick={() => { selectBranch(branch.id); setActiveOverlay(null); }} className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-taste-purple-soft ${branch.id === currentBranch?.id ? "bg-taste-purple-soft font-semibold text-taste-text" : "text-slate-700"}`}><span>{branch.name}</span>{branch.id === currentBranch?.id && <span aria-hidden="true">✓</span>}</button>)}</div>
      </ContextualPopover>

      <ContextualPopover open={activeOverlay === "calendar"} anchorRef={calendarTriggerRef} onClose={() => setActiveOverlay(null)} width={260}>
        <h2 className="mb-3 text-sm font-semibold text-slate-900">Select date</h2>
        <input type="date" value={selectedDate} onChange={(event) => setSelectedDate(event.target.value)} className="w-full rounded-xl border border-taste-border bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-taste-purple focus:ring-2 focus:ring-taste-purple/20" aria-label="Select date" />
        <Button className="mt-3 w-full" size="sm" onClick={() => setActiveOverlay(null)}>Apply date</Button>
      </ContextualPopover>
    </header>
  );
}

export default Topbar;
