import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MoreHorizontal, Plus, Search, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Alert, Badge, Button, ConfirmDialog, Drawer, EmptyState, ErrorState, FormField, Input, Modal, Select, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow, Toast, ContextualPopover } from "../../components/ui";
// intentionally blank, or remove if other exports are also unused
import PageContainer from "../../components/layout/PageContainer";
import { createStaff, listStaff, updateStaff, updateStaffStatus, archiveStaff, restoreStaff, resendCredentials, hardDeleteStaff } from "../../services/staffService";

const initialForm = { name: "", email: "", employeeId: "", branchId: "" };
const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });
const initials = (name) => {
  if (!name || name === "Unknown" || name === "Taste It Staff") return "ST";
  return name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
};

function Avatar({ name, avatarUrl }) { 
  return avatarUrl ? (
    <img src={avatarUrl} alt="" className="h-11 w-11 rounded-xl object-cover border border-taste-border" />
  ) : (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-taste-purple-soft font-semibold text-taste-purple-strong shadow-sm" aria-hidden="true">
      {initials(name)}
    </span>
  );
}

function StaffForm({ staff, branches, actorRole, onClose, onSaved }) {
  const [form, setForm] = useState(() => staff ? { name: staff.name, email: staff.email, employeeId: staff.employeeId, branchId: staff.branchId } : { ...initialForm, branchId: branches[0]?.id ?? "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => { 
    event.preventDefault(); 
    setSaving(true); 
    setError(""); 
    try { 
      const saved = staff 
        ? await updateStaff(staff.id, form, { actorRole }) 
        : await createStaff(form, { actorRole }); 
      onSaved(saved, !staff); 
    } catch (saveError) { 
      setError(saveError.message); 
    } finally { 
      setSaving(false); 
    } 
  };

  return (
    <Modal open onClose={onClose} title={staff ? "Edit Staff Account" : "Add Staff Account"} className="max-h-[calc(100vh-1rem)] max-w-xl overflow-y-auto" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="staff-form" loading={saving}>{staff ? "Save Changes" : "Create Staff"}</Button></>}>
      <form id="staff-form" onSubmit={submit} className="space-y-6">
        <p className="text-sm text-slate-500 -mt-2">Create a staff account and assign access to a branch.</p>
        {error && <Alert variant="danger" title="Unable to save account">{error}</Alert>}
        
        <div className="grid gap-5 sm:grid-cols-2">
          {!staff && (
            <FormField label="Email" required className="sm:col-span-2">
              <Input type="email" value={form.email} onChange={(event) => change("email", event.target.value)} required placeholder="staff@tasteit.com" />
            </FormField>
          )}
          <FormField label="Staff ID / Employee ID" required>
             <Input value={form.employeeId} onChange={(event) => change("employeeId", event.target.value)} required placeholder="EMP-001" />
          </FormField>
          <FormField label="Branch" required>
            <Select value={form.branchId} onChange={(event) => change("branchId", event.target.value)} required aria-label="Assign Staff branch">
              <option value="">Select active branch</option>
              {branches.filter((branch) => branch.status === "ACTIVE").map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
            </Select>
          </FormField>
          <FormField label="Full Name" className="sm:col-span-2">
            <Input value={form.name} onChange={(event) => change("name", event.target.value)} placeholder="e.g. Gwenyth Alcala (Optional)" />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

function StaffDetails({ staff, branchName, onClose, onEdit, onStatus, onArchiveToggle, onResend, onDelete, isHardDeleteEnabled }) {
  if (!staff) return null;
  return (
    <Drawer 
      open 
      onClose={onClose} 
      title="Staff Details"
      footer={
        <div className="flex w-full flex-col gap-2">
          <Button variant="primary" className="w-full" onClick={() => { onClose(); onEdit(staff); }}>Edit Staff</Button>
          {!staff.isArchived && <Button variant={staff.status === "ACTIVE" ? "ghost" : "subtle"} className="w-full" onClick={() => { onClose(); onStatus(staff); }}>{staff.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"}</Button>}
          <Button variant="ghost" className="w-full" onClick={() => { onClose(); onArchiveToggle(staff); }}>{staff.isArchived ? "Restore Account" : "Archive Account"}</Button>
          <Button variant="ghost" className="w-full" onClick={() => { onClose(); onResend(staff); }}>Resend Credentials</Button>
          {isHardDeleteEnabled && <div className="mt-4 border-t border-taste-border pt-4"><Button variant="danger" className="w-full" onClick={() => { onClose(); onDelete(staff); }}>Hard Delete</Button></div>}
        </div>
      }
    >
      <div className="p-6 space-y-8">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="scale-125"><Avatar name={staff.name} avatarUrl={staff.avatarUrl} /></div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{staff.name || "Unnamed Staff"}</h2>
            <p className="text-sm font-medium text-slate-500 mt-0.5">{staff.employeeId}</p>
            <div className="mt-3 flex justify-center"><StatusBadge status={staff.isArchived ? "archived" : staff.status === "ACTIVE" ? "active" : "inactive"} /></div>
          </div>
        </div>
        
        <div>
          <h3 className="mb-3 text-sm font-bold tracking-wide text-slate-900 uppercase">Account Information</h3>
          <div className="overflow-hidden rounded-xl border border-taste-border bg-white shadow-sm">
            <div className="flex flex-col gap-y-3 p-4 text-sm">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Email</span>
                <span className="font-semibold text-slate-900">{staff.email}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Role</span>
                <Badge variant="purple">Staff</Badge>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Assigned Branch</span>
                <span className="font-semibold text-slate-900">{branchName}</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-500 font-medium">Last Activity</span>
                <span className="font-semibold text-slate-900">{dateFormat.format(new Date(staff.updatedAt))}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  );
}

function StaffCard({ staff, branchName, onView }) { 
  const active = staff.status === "ACTIVE"; 
  const archived = staff.isArchived;

  return (
    <div className="rounded-2xl border border-taste-border bg-white p-5 shadow-card transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={staff.name} avatarUrl={staff.avatarUrl} />
          <div className="min-w-0">
            <h2 className="truncate font-bold text-slate-900">{staff.name || "Unnamed Staff"}</h2>
            <p className="truncate text-sm font-medium text-slate-500">{staff.employeeId}</p>
          </div>
        </div>
        <StatusBadge status={archived ? "archived" : active ? "active" : "inactive"} />
      </div>
      <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Role</span>
          <span className="font-medium">Staff</span>
        </div>
        <div>
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Branch</span>
          <span className="font-medium truncate block">{branchName}</span>
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => onView(staff)}>View Details</Button>
      </div>
    </div>
  ); 
}

function RowActions({ staff, openMenu, setOpenMenu, onView, onEdit, onStatus, onArchiveToggle, onResend, onDelete, isHardDeleteEnabled }) {
  const active = openMenu === staff.id;
  const buttonRef = useRef(null);

  return (
    <div className="flex justify-end">
      <div ref={buttonRef}>
        <Button variant="ghost" size="sm" aria-label={`Actions for ${staff.name}`} title={`Actions for ${staff.name}`} onClick={(e) => { e.stopPropagation(); setOpenMenu(active ? null : staff.id); }}>
          <MoreHorizontal size={18} />
        </Button>
      </div>
      <ContextualPopover open={active} anchorRef={buttonRef} onClose={() => setOpenMenu(null)} placement="bottom" width={220}>
        <div className="flex flex-col p-1">
          <button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => { setOpenMenu(null); onView(staff); }}>View details</button>
          <button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => { setOpenMenu(null); onEdit(staff); }}>Edit staff</button>
          {!staff.isArchived && <button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => { setOpenMenu(null); onStatus(staff); }}>{staff.status === "ACTIVE" ? "Deactivate" : "Activate"}</button>}
          <button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => { setOpenMenu(null); onArchiveToggle(staff); }}>{staff.isArchived ? "Restore" : "Archive"}</button>
          <button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors" onClick={() => { setOpenMenu(null); onResend(staff); }}>Resend Credentials</button>
          {isHardDeleteEnabled && <div className="mt-1 border-t border-red-100 pt-1"><button type="button" className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-bold text-red-600 hover:bg-red-50 transition-colors" onClick={() => { setOpenMenu(null); onDelete(staff); }}>Hard Delete</button></div>}
        </div>
      </ContextualPopover>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="hidden md:block">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell as="th">Staff</TableCell>
            <TableCell as="th">Role</TableCell>
            <TableCell as="th">Assigned branch</TableCell>
            <TableCell as="th">Status</TableCell>
            <TableCell as="th">Last activity</TableCell>
            <TableCell as="th" className="text-right">Actions</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[1, 2, 3].map((i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-4">
                  <div className="h-11 w-11 rounded-xl bg-slate-100 animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-4 w-32 rounded bg-slate-100 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-slate-100 animate-pulse" />
                  </div>
                </div>
              </TableCell>
              <TableCell><div className="h-6 w-16 rounded-full bg-slate-100 animate-pulse" /></TableCell>
              <TableCell><div className="h-4 w-24 rounded bg-slate-100 animate-pulse" /></TableCell>
              <TableCell><div className="h-6 w-20 rounded-full bg-slate-100 animate-pulse" /></TableCell>
              <TableCell><div className="h-4 w-28 rounded bg-slate-100 animate-pulse" /></TableCell>
              <TableCell><div className="h-8 w-8 ml-auto rounded-lg bg-slate-100 animate-pulse" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function StaffManagement() {
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const isHardDeleteEnabled = import.meta.env.VITE_STAFF_HARD_DELETE_ENABLED === "true";
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [branchId, setBranchId] = useState("ALL");
  const [formStaff, setFormStaff] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState(null);
  
  // Pending actions
  const [pendingStatus, setPendingStatus] = useState(null);
  const [pendingArchive, setPendingArchive] = useState(null);
  const [pendingResend, setPendingResend] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  
  const [openMenu, setOpenMenu] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isMounted) return;
      setLoading(true);
      try {
        const nextStaff = await listStaff({ actorRole: currentUser.role });
        if (isMounted) setStaff(nextStaff);
        if (isMounted) setError("");
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [currentUser.role]);

  const branchName = useCallback((id) => branches.find((branch) => branch.id === id)?.name ?? "Unknown branch", [branches]);

  const filtered = useMemo(() => staff.filter((record) => { 
    const term = search.toLowerCase().trim(); 
    
    // Search matching
    const matchesSearch = !term || `${record.name} ${record.email} ${record.employeeId} ${branchName(record.branchId)}`.toLowerCase().includes(term);
    
    // Status matching (Active, Inactive, Archived, All)
    let matchesStatus = true;
    if (status === "ACTIVE") matchesStatus = !record.isArchived && record.status === "ACTIVE";
    if (status === "INACTIVE") matchesStatus = !record.isArchived && record.status === "INACTIVE";
    if (status === "ARCHIVED") matchesStatus = record.isArchived;
    // if "ALL", no filtering by status
    
    // Branch matching
    const matchesBranch = branchId === "ALL" || record.branchId === branchId;

    return matchesSearch && matchesStatus && matchesBranch;
  }), [staff, search, status, branchId, branchName]);

  const hasFilters = search || status !== "ACTIVE" || branchId !== "ALL";
  const notify = (message, variant = "success") => setToast({ open: true, message, variant });
  
  const afterSave = async (saved, isNew) => { 
    setFormOpen(false); 
    setFormStaff(null); 
    const nextStaff = await listStaff({ actorRole: currentUser.role }); 
    setStaff(nextStaff); 
    
    if (isNew) {
      notify(`Staff account created successfully. Temporary credentials have been sent.`);
    } else {
      notify(`${saved.name} updated successfully.`); 
    }
  };
  
  const changeStatus = async () => { 
    try { 
      const nextStatus = pendingStatus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"; 
      await updateStaffStatus(pendingStatus.id, nextStatus, { actorRole: currentUser.role }); 
      setPendingStatus(null); 
      const nextStaff = await listStaff({ actorRole: currentUser.role }); 
      setStaff(nextStaff); 
      notify(`${pendingStatus.name}'s account is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`); 
    } catch (statusError) { 
      setPendingStatus(null); 
      notify(statusError.message, "danger"); 
    } 
  };

  const toggleArchive = async () => {
    try {
      const isCurrentlyArchived = pendingArchive.isArchived;
      if (isCurrentlyArchived) {
        await restoreStaff(pendingArchive.id, { actorRole: currentUser.role });
      } else {
        await archiveStaff(pendingArchive.id, { actorRole: currentUser.role });
      }
      setPendingArchive(null);
      const nextStaff = await listStaff({ actorRole: currentUser.role });
      setStaff(nextStaff);
      notify(`${pendingArchive.name} has been ${isCurrentlyArchived ? "restored" : "archived"}.`);
    } catch (archiveError) {
      setPendingArchive(null);
      notify(archiveError.message, "danger");
    }
  };

  const handleResend = async () => {
    if (!pendingResend) return;
    try {
      await resendCredentials(pendingResend.id, pendingResend.email, { actorRole: currentUser.role });
      notify(`Credentials sent to ${pendingResend.email} successfully.`);
    } catch (err) {
      notify(err.message, "danger");
    } finally {
      setPendingResend(null);
    }
  };

  const handleHardDelete = async () => {
    if (!pendingDelete) return;
    try {
      await hardDeleteStaff(pendingDelete.id, { actorRole: currentUser.role });
      notify(`${pendingDelete.name} was permanently deleted.`);
      const nextStaff = await listStaff({ actorRole: currentUser.role });
      setStaff(nextStaff);
    } catch (err) {
      notify(err.message, "danger");
    } finally {
      setPendingDelete(null);
    }
  };

  if (error) return <PageContainer><ErrorState title="Staff Management unavailable" description={error} action={<Button onClick={async () => { const nextStaff = await listStaff({ actorRole: currentUser.role }); setStaff(nextStaff); setError(""); }}>Try again</Button>} /></PageContainer>;
  
  return (
    <PageContainer className="pb-12">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Staff Management</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage staff accounts, access, and branch assignments.</p>
        </div>
        <Button onClick={() => { setFormStaff(null); setFormOpen(true); }} className="shrink-0 shadow-sm"><Plus size={18} />Add Staff</Button>
      </div>

      <div className="rounded-2xl border border-taste-border bg-white shadow-card overflow-hidden">
        {/* Toolbar */}
        <div className="border-b border-taste-border bg-slate-50/50 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                value={search} 
                onChange={(event) => setSearch(event.target.value)} 
                placeholder="Search by name, staff ID, or email..." 
                aria-label="Search Staff accounts" 
                className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-4 text-sm font-medium outline-none transition-all focus:border-taste-purple focus:ring-1 focus:ring-taste-purple placeholder:text-slate-400"
              />
            </div>
            <div className="flex items-center gap-3">
              <Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter Staff status" className="h-10 min-w-36 font-medium text-slate-700">
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ARCHIVED">Archived</option>
              </Select>
              <Select value={branchId} onChange={(event) => setBranchId(event.target.value)} aria-label="Filter Staff branch" className="h-10 min-w-40 font-medium text-slate-700">
                <option value="ALL">All branches</option>
                {branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}
              </Select>
              {hasFilters && <Button variant="ghost" size="sm" className="h-10 px-3 text-slate-500 hover:text-slate-900" onClick={() => { setSearch(""); setStatus("ACTIVE"); setBranchId("ALL"); }}>Clear</Button>}
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-1">
             <TableSkeleton />
             <div className="md:hidden flex flex-col gap-4 p-4">
               <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
               <div className="h-32 rounded-2xl bg-slate-100 animate-pulse" />
             </div>
          </div>
        ) : filtered.length > 0 ? (
          <>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-white hover:bg-white border-b border-taste-border">
                    <TableCell as="th" className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Staff</TableCell>
                    <TableCell as="th" className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Role</TableCell>
                    <TableCell as="th" className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Assigned Branch</TableCell>
                    <TableCell as="th" className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Status</TableCell>
                    <TableCell as="th" className="text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Last Activity</TableCell>
                    <TableCell as="th" className="text-right text-xs font-bold uppercase tracking-wider text-slate-500 py-4">Actions</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((record) => (
                    <TableRow key={record.id} className="group transition-colors hover:bg-slate-50/50 cursor-pointer" onClick={() => setDetails(record)}>
                      <TableCell>
                        <div className="flex min-w-48 items-center gap-4">
                          <Avatar name={record.name} avatarUrl={record.avatarUrl} />
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">{record.name || "Unnamed Staff"}</p>
                            <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{record.employeeId}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="purple">Staff</Badge></TableCell>
                      <TableCell className="whitespace-nowrap font-medium text-slate-700">{branchName(record.branchId)}</TableCell>
                      <TableCell><StatusBadge status={record.isArchived ? "archived" : record.status === "ACTIVE" ? "active" : "inactive"} /></TableCell>
                      <TableCell className="whitespace-nowrap text-sm font-medium text-slate-500">{dateFormat.format(new Date(record.updatedAt))}</TableCell>
                      <TableCell>
                        <RowActions staff={record} openMenu={openMenu} setOpenMenu={setOpenMenu} onView={setDetails} onEdit={(item) => { setFormStaff(item); setFormOpen(true); }} onStatus={setPendingStatus} onArchiveToggle={setPendingArchive} onResend={setPendingResend} onDelete={setPendingDelete} isHardDeleteEnabled={isHardDeleteEnabled} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="grid gap-4 p-4 md:hidden bg-slate-50/30">
              {filtered.map((record) => <StaffCard key={record.id} staff={record} branchName={branchName(record.branchId)} onView={setDetails} />)}
            </div>
            <div className="border-t border-taste-border bg-slate-50 px-5 py-3 text-xs font-medium text-slate-500">
              Showing {filtered.length} staff account{filtered.length === 1 ? "" : "s"}
            </div>
          </>
        ) : (
          <div className="px-6 py-16 text-center flex flex-col items-center">
            <EmptyState 
              icon={<Users size={32} className="text-taste-purple" />}
              title="No staff accounts found" 
              description={hasFilters ? "Try adjusting your search or filters to find what you're looking for." : "Add your first staff account to start managing your cafe team."} 
              action={!hasFilters && <Button onClick={() => setFormOpen(true)} className="mt-4"><Plus size={17} />Add Staff</Button>} 
            />
          </div>
        )}
      </div>
      
      <StaffDetails staff={details} branchName={details ? branchName(details.branchId) : ""} onClose={() => setDetails(null)} onEdit={(item) => { setFormStaff(item); setFormOpen(true); }} onStatus={setPendingStatus} onArchiveToggle={setPendingArchive} onResend={setPendingResend} onDelete={setPendingDelete} isHardDeleteEnabled={isHardDeleteEnabled} />
      
      {formOpen && <StaffForm staff={formStaff} branches={branches} actorRole={currentUser.role} onClose={() => { setFormOpen(false); setFormStaff(null); }} onSaved={afterSave} />}
      
      <ConfirmDialog open={Boolean(pendingStatus)} onClose={() => setPendingStatus(null)} onConfirm={changeStatus} danger={pendingStatus?.status === "ACTIVE"} confirmLabel={pendingStatus?.status === "ACTIVE" ? "Deactivate Account" : "Activate Account"} title={pendingStatus?.status === "ACTIVE" ? "Deactivate Staff Account?" : "Activate Staff Account?"} description={pendingStatus?.status === "ACTIVE" ? `${pendingStatus?.name} will no longer be able to sign in. Historical records will remain available.` : `${pendingStatus?.name} will be able to sign in again.`} />
      
      <ConfirmDialog open={Boolean(pendingArchive)} onClose={() => setPendingArchive(null)} onConfirm={toggleArchive} danger={!pendingArchive?.isArchived} confirmLabel={pendingArchive?.isArchived ? "Restore Account" : "Archive Account"} title={pendingArchive?.isArchived ? "Restore Staff Account?" : "Archive Staff Account?"} description={pendingArchive?.isArchived ? `${pendingArchive?.name} will be restored and visible in the active staff list.` : `${pendingArchive?.name} will be archived and hidden from the active staff list.`} />

      <ConfirmDialog open={Boolean(pendingResend)} onClose={() => setPendingResend(null)} onConfirm={handleResend} confirmLabel="Resend" title="Resend Staff Credentials?" description={`A new temporary password will be generated and emailed to ${pendingResend?.email}. Their current password will stop working immediately.`} />

      <ConfirmDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={handleHardDelete} danger confirmLabel="Permanently Delete" title="Permanently Delete Account?" description={`Are you absolutely sure you want to delete ${pendingDelete?.name} (${pendingDelete?.employeeId})? This will permanently remove their profile and login access. This action cannot be undone.`} />

      <Toast open={toast.open} variant={toast.variant} onClose={() => setToast((current) => ({ ...current, open: false }))}>{toast.message}</Toast>
    </PageContainer>
  );
}
