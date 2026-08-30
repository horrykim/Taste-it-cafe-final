import { useCallback, useEffect, useMemo, useState } from "react";
import { Edit3, Eye, MoreHorizontal, Plus, Power } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Alert, Badge, Button, ConfirmDialog, ContentCard, Dropdown, EmptyState, ErrorState, FormField, Input, LoadingState, Modal, SearchInput, Select, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow, Textarea, Toast } from "../../components/ui";
import { FilterBar, PageHeader, SectionHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { createStaff, listStaff, updateStaff, updateStaffStatus } from "../../services/staffService";

const initialForm = { name: "", email: "", phone: "", branchId: "", password: "", newPassword: "", notes: "" };
const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });
const initials = (name) => name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();

function Avatar({ name, image }) { return image ? <img src={image} alt="" className="h-11 w-11 rounded-xl object-cover" /> : <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-taste-purple-soft font-semibold text-fuchsia-800" aria-hidden="true">{initials(name)}</span>; }

function StaffForm({ staff, branches, actorRole, onClose, onSaved }) {
  const [form, setForm] = useState(() => staff ? { ...initialForm, ...staff } : { ...initialForm, branchId: branches[0]?.id ?? "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { const { newPassword, ...fields } = form; const payload = newPassword ? { ...fields, password: newPassword } : fields; const saved = staff ? await updateStaff(staff.id, payload, { actorRole }) : await createStaff({ ...payload, password: form.password }, { actorRole }); onSaved(saved); } catch (saveError) { setError(saveError.message); } finally { setSaving(false); } };
  return <Modal open onClose={onClose} title={staff ? "Edit Staff account" : "Add Staff account"} className="max-h-[calc(100vh-1rem)] max-w-2xl overflow-y-auto" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="staff-form" loading={saving}>{staff ? "Save changes" : "Add Staff"}</Button></>}><form id="staff-form" onSubmit={submit} className="space-y-5"><p className="text-sm text-slate-500">Staff accounts can access only their assigned active branch.</p>{error && <Alert variant="danger" title="Unable to save account">{error}</Alert>}<div className="grid gap-4 sm:grid-cols-2"><FormField label="Full name" required><Input value={form.name} onChange={(event) => change("name", event.target.value)} required placeholder="Staff member name" /></FormField><FormField label="Email" required><Input type="email" value={form.email} onChange={(event) => change("email", event.target.value)} required placeholder="staff@tasteit.com" /></FormField><FormField label="Branch" required><Select value={form.branchId} onChange={(event) => change("branchId", event.target.value)} required aria-label="Assign Staff branch"><option value="">Select active branch</option>{branches.filter((branch) => branch.status === "ACTIVE").map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select></FormField><FormField label="Phone"><Input value={form.phone} onChange={(event) => change("phone", event.target.value)} placeholder="+63 917 000 0000" /></FormField><FormField label={staff ? "New password" : "Password"} required={!staff} hint={staff ? "Leave blank to keep the current password." : "At least 6 characters."}><Input type="password" value={staff ? form.newPassword : form.password} onChange={(event) => change(staff ? "newPassword" : "password", event.target.value)} required={!staff} minLength={6} autoComplete="new-password" /></FormField><FormField label="Profile image URL"><Input value={form.image ?? ""} onChange={(event) => change("image", event.target.value)} placeholder="Optional local or image URL" /></FormField></div><FormField label="Notes"><Textarea value={form.notes} onChange={(event) => change("notes", event.target.value)} placeholder="Optional account notes" /></FormField></form></Modal>;
}

function StaffDetails({ staff, branchName, onClose }) {
  if (!staff) return null;
  return <Modal open onClose={onClose} title={`${staff.name} details`} className="max-h-[calc(100vh-1rem)] max-w-xl overflow-y-auto" footer={<Button variant="outline" onClick={onClose}>Close details</Button>}><div className="space-y-5"><div className="flex items-center gap-3"><Avatar name={staff.name} image={staff.image} /><div><h2 className="font-semibold text-slate-900">{staff.name}</h2><p className="text-sm text-slate-500">{staff.email}</p></div></div><div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Role:</span> Staff</p><p><span className="text-slate-500">Status:</span> <StatusBadge status={staff.status === "ACTIVE" ? "active" : "inactive"} /></p><p><span className="text-slate-500">Branch:</span> {branchName}</p><p><span className="text-slate-500">Phone:</span> {staff.phone || "Not recorded"}</p><p><span className="text-slate-500">Created:</span> {dateFormat.format(new Date(staff.createdAt))}</p><p><span className="text-slate-500">Updated:</span> {dateFormat.format(new Date(staff.updatedAt))}</p></div>{staff.notes && <div className="rounded-xl border border-taste-border p-4 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Notes</p><p className="mt-1">{staff.notes}</p></div>}</div></Modal>;
}

function StaffCard({ staff, branchName, onView, onEdit, onStatus }) { const active = staff.status === "ACTIVE"; return <div className="rounded-xl border border-taste-border bg-white p-4 shadow-card"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3"><Avatar name={staff.name} image={staff.image} /><div className="min-w-0"><h2 className="truncate font-semibold text-slate-900">{staff.name}</h2><p className="truncate text-sm text-slate-500">{staff.email}</p></div></div><StatusBadge status={active ? "active" : "inactive"} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600"><p><span className="block text-xs text-slate-500">Role</span>Staff</p><p><span className="block text-xs text-slate-500">Branch</span>{branchName}</p><p><span className="block text-xs text-slate-500">Contact</span>{staff.phone || "Not recorded"}</p><p><span className="block text-xs text-slate-500">Updated</span>{dateFormat.format(new Date(staff.updatedAt))}</p></div><div className="mt-4 flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={() => onView(staff)}><Eye size={15} />View details</Button><Button variant="ghost" size="sm" onClick={() => onEdit(staff)}><Edit3 size={15} />Edit</Button><Button variant={active ? "ghost" : "subtle"} size="sm" onClick={() => onStatus(staff)}><Power size={15} />{active ? "Deactivate" : "Activate"}</Button></div></div>; }

function RowActions({ staff, openMenu, setOpenMenu, onView, onEdit, onStatus }) {
  const active = openMenu === staff.id;
  return <div className="relative flex justify-end"><Button variant="ghost" size="sm" aria-label={`Actions for ${staff.name}`} title={`Actions for ${staff.name}`} onClick={() => setOpenMenu(active ? null : staff.id)}><MoreHorizontal size={18} /></Button><Dropdown open={active} className="right-0 top-10"><button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpenMenu(null); onView(staff); }}>View details</button><button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpenMenu(null); onEdit(staff); }}>Edit staff</button><button type="button" className="block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100" onClick={() => { setOpenMenu(null); onStatus(staff); }}>{staff.status === "ACTIVE" ? "Deactivate" : "Activate"}</button></Dropdown></div>;
}

export default function StaffManagement() {
  const { currentUser } = useAuth();
  const { branches } = useBranch();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [branchId, setBranchId] = useState("ALL");
  const [role, setRole] = useState("ALL");
  const [formStaff, setFormStaff] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
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
  const filtered = useMemo(() => staff.filter((record) => { const term = search.toLowerCase().trim(); return (!term || `${record.name} ${record.email} ${record.phone} ${branchName(record.branchId)}`.toLowerCase().includes(term)) && (status === "ALL" || record.status === status) && (branchId === "ALL" || record.branchId === branchId) && (role === "ALL" || record.role === role); }), [staff, search, status, branchId, role, branchName]);
  const hasFilters = search || status !== "ALL" || branchId !== "ALL" || role !== "ALL";
  const notify = (message, variant = "success") => setToast({ open: true, message, variant });
  const afterSave = async (saved) => { setFormOpen(false); setFormStaff(null); const nextStaff = await listStaff({ actorRole: currentUser.role }); setStaff(nextStaff); notify(`${saved.name} ${saved.id === formStaff?.id ? "updated" : "added"} successfully.`); };
  const openStatus = (record) => setPendingStatus(record);
  const changeStatus = async () => { try { const nextStatus = pendingStatus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"; await updateStaffStatus(pendingStatus.id, nextStatus, { actorRole: currentUser.role }); setPendingStatus(null); const nextStaff = await listStaff({ actorRole: currentUser.role }); setStaff(nextStaff); notify(`${pendingStatus.name}'s account is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`); } catch (statusError) { setPendingStatus(null); notify(statusError.message, "danger"); } };
  if (loading) return <PageContainer><LoadingState label="Loading Staff accounts" /></PageContainer>;
  if (error) return <PageContainer><ErrorState title="Staff Management unavailable" description={error} action={<Button onClick={async () => { const nextStaff = await listStaff({ actorRole: currentUser.role }); setStaff(nextStaff); setError(""); }}>Try again</Button>} /></PageContainer>;
  return <PageContainer><PageHeader title="Staff Management" description="Manage Staff accounts, status, and branch assignments." actions={<Button onClick={() => { setFormStaff(null); setFormOpen(true); }}><Plus size={17} />Add Staff</Button>} /><FilterBar className="mt-7"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name, email, phone, or branch" aria-label="Search Staff accounts" className="sm:min-w-64 sm:max-w-sm" /><Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter Staff status" className="sm:max-w-40"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select><Select value={branchId} onChange={(event) => setBranchId(event.target.value)} aria-label="Filter Staff branch" className="sm:max-w-48"><option value="ALL">All branches</option>{branches.map((branch) => <option key={branch.id} value={branch.id}>{branch.name}</option>)}</Select><Select value={role} onChange={(event) => setRole(event.target.value)} aria-label="Filter Staff role" className="sm:max-w-40"><option value="ALL">All roles</option><option value="STAFF">Staff</option></Select>{hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus("ALL"); setBranchId("ALL"); setRole("ALL"); }}>Clear filters</Button>}</FilterBar><ContentCard className="mt-7"><SectionHeader title="Staff accounts" description={`${filtered.length} Staff account${filtered.length === 1 ? "" : "s"} in view.`} />{filtered.length ? <><div className="mt-5 hidden md:block"><Table><TableHeader><TableRow><TableCell as="th">Staff</TableCell><TableCell as="th">Role</TableCell><TableCell as="th">Assigned branch</TableCell><TableCell as="th">Status</TableCell><TableCell as="th">Contact</TableCell><TableCell as="th">Last activity</TableCell><TableCell as="th" className="text-right">Actions</TableCell></TableRow></TableHeader><TableBody>{filtered.map((record) => <TableRow key={record.id}><TableCell><div className="flex min-w-48 items-center gap-3"><Avatar name={record.name} image={record.image} /><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{record.name}</p><p className="truncate text-xs text-slate-500">{record.email}</p></div></div></TableCell><TableCell><Badge variant="purple">Staff</Badge></TableCell><TableCell className="whitespace-nowrap">{branchName(record.branchId)}</TableCell><TableCell><StatusBadge status={record.status === "ACTIVE" ? "active" : "inactive"} /></TableCell><TableCell className="max-w-40 truncate">{record.phone || "Not recorded"}</TableCell><TableCell className="whitespace-nowrap text-slate-500">{dateFormat.format(new Date(record.updatedAt))}</TableCell><TableCell><RowActions staff={record} openMenu={openMenu} setOpenMenu={setOpenMenu} onView={setDetails} onEdit={(item) => { setFormStaff(item); setFormOpen(true); }} onStatus={openStatus} /></TableCell></TableRow>)}</TableBody></Table></div><div className="mt-5 grid gap-3 md:hidden">{filtered.map((record) => <StaffCard key={record.id} staff={record} branchName={branchName(record.branchId)} onView={setDetails} onEdit={(item) => { setFormStaff(item); setFormOpen(true); }} onStatus={openStatus} />)}</div></> : <div className="mt-5"><EmptyState title="No Staff accounts found" description={hasFilters ? "Try adjusting your search or filters." : "Add a Staff account to get started."} action={!hasFilters && <Button onClick={() => setFormOpen(true)}><Plus size={17} />Add Staff</Button>} /></div>}</ContentCard><StaffDetails staff={details} branchName={details ? branchName(details.branchId) : ""} onClose={() => setDetails(null)} />{formOpen && <StaffForm staff={formStaff} branches={branches} actorRole={currentUser.role} onClose={() => { setFormOpen(false); setFormStaff(null); }} onSaved={afterSave} />}<ConfirmDialog open={Boolean(pendingStatus)} onClose={() => setPendingStatus(null)} onConfirm={changeStatus} danger={pendingStatus?.status === "ACTIVE"} confirmLabel={pendingStatus?.status === "ACTIVE" ? "Deactivate account" : "Activate account"} title={pendingStatus?.status === "ACTIVE" ? "Deactivate Staff account?" : "Activate Staff account?"} description={pendingStatus?.status === "ACTIVE" ? `${pendingStatus?.name} will no longer be able to sign in. Historical records will remain available.` : `${pendingStatus?.name} will be able to sign in again.`} /><Toast open={toast.open} variant={toast.variant} onClose={() => setToast((current) => ({ ...current, open: false }))}>{toast.message}</Toast></PageContainer>;
}
