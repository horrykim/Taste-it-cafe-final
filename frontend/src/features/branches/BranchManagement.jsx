import { useCallback, useEffect, useMemo, useState } from "react";
import { Clock3, Edit3, Eye, MapPin, Phone, Plus, Power } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Alert, Button, ConfirmDialog, ContentCard, EmptyState, ErrorState, FormField, Input, LoadingState, Modal, SearchInput, Select, StatusBadge, Textarea, Toast } from "../../components/ui";
import { FilterBar, PageHeader, SectionHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { getBranches, saveBranch, setBranchStatus } from "../../services/branchService";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const initialForm = { name: "", code: "", address: "", contactNumber: "", email: "", managerName: "", openingTime: "08:00", closingTime: "21:00", operatingDays: DAYS, notes: "" };
const formatTime = (value) => new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" }).format(new Date(`2026-01-01T${value}`));
const formatDate = (value) => new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(value));

function BranchForm({ branch, onClose, onSaved, actorRole }) {
  const [form, setForm] = useState(() => branch ? { ...initialForm, ...branch } : initialForm);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const toggleDay = (day) => setForm((current) => ({ ...current, operatingDays: current.operatingDays.includes(day) ? current.operatingDays.filter((entry) => entry !== day) : [...current.operatingDays, day] }));
  const submit = async (event) => { event.preventDefault(); setSaving(true); setError(""); try { const saved = await saveBranch(form, { actorRole }); onSaved(saved); } catch (saveError) { setError(saveError.message); } finally { setSaving(false); } };
  return <Modal open onClose={onClose} title={branch ? "Edit branch" : "Add branch"} className="max-h-[calc(100vh-1rem)] max-w-3xl overflow-y-auto" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="branch-form" loading={saving}>{branch ? "Save changes" : "Add branch"}</Button></>}><form id="branch-form" onSubmit={submit} className="space-y-5"><p className="text-sm text-slate-500">Required fields are marked with an asterisk.</p>{error && <Alert variant="danger" title="Unable to save branch">{error}</Alert>}<div className="grid gap-4 sm:grid-cols-2"><FormField label="Branch name" required><Input value={form.name} onChange={(event) => change("name", event.target.value)} required placeholder="e.g. Banilad" /></FormField><FormField label="Branch code" required hint="Use a short unique code."><Input value={form.code} onChange={(event) => change("code", event.target.value.toUpperCase())} required placeholder="e.g. BAN" /></FormField><FormField label="Address" required><Input value={form.address} onChange={(event) => change("address", event.target.value)} required placeholder="Complete branch address" /></FormField><FormField label="Contact number" required><Input value={form.contactNumber} onChange={(event) => change("contactNumber", event.target.value)} required placeholder="+63 917 000 0000" /></FormField><FormField label="Email"><Input type="email" value={form.email} onChange={(event) => change("email", event.target.value)} placeholder="branch@tasteit.com" /></FormField><FormField label="Manager"><Input value={form.managerName} onChange={(event) => change("managerName", event.target.value)} placeholder="Branch manager" /></FormField><FormField label="Opening time" required><Input type="time" value={form.openingTime} onChange={(event) => change("openingTime", event.target.value)} required /></FormField><FormField label="Closing time" required><Input type="time" value={form.closingTime} onChange={(event) => change("closingTime", event.target.value)} required /></FormField></div><fieldset><legend className="mb-2 text-sm font-medium text-slate-800">Operating days <span className="text-rose-600">*</span></legend><div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{DAYS.map((day) => <label key={day} className="flex items-center gap-2 rounded-lg border border-taste-border px-3 py-2 text-sm text-slate-700"><input type="checkbox" checked={form.operatingDays.includes(day)} onChange={() => toggleDay(day)} className="h-4 w-4 accent-taste-purple" />{day}</label>)}</div></fieldset><FormField label="Notes"><Textarea value={form.notes} onChange={(event) => change("notes", event.target.value)} placeholder="Optional operational notes" /></FormField></form></Modal>;
}

function BranchDetails({ branch, onClose }) {
  if (!branch) return null;
  return <Modal open onClose={onClose} title={`${branch.name} details`} className="max-h-[calc(100vh-1rem)] max-w-2xl overflow-y-auto" footer={<Button variant="outline" onClick={onClose}>Close details</Button>}><div className="space-y-5"><div className="flex items-start justify-between gap-4"><div><p className="text-2xl font-bold text-slate-900">{branch.name}</p><p className="mt-1 text-sm text-slate-500">{branch.code}</p></div><StatusBadge status={branch.status === "ACTIVE" ? "completed" : "inactive"} label={branch.status === "ACTIVE" ? "Active" : "Inactive"} /></div><div className="grid gap-5 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2"><div><p className="font-semibold text-slate-800">Location & contact</p><p className="mt-2 text-slate-600">{branch.address}</p><p className="mt-1 text-slate-600">{branch.contactNumber}</p><p className="mt-1 break-all text-slate-600">{branch.email || "No email recorded"}</p></div><div><p className="font-semibold text-slate-800">Operations</p><p className="mt-2 text-slate-600">{formatTime(branch.openingTime)} - {formatTime(branch.closingTime)}</p><p className="mt-1 leading-6 text-slate-600">{branch.operatingDays.join(", ")}</p></div></div><div className="grid gap-3 text-sm sm:grid-cols-2"><p><span className="text-slate-500">Manager:</span> {branch.managerName || "Not assigned"}</p><p><span className="text-slate-500">Created:</span> {formatDate(branch.createdAt)}</p><p className="sm:col-span-2"><span className="text-slate-500">Updated:</span> {formatDate(branch.updatedAt)}</p></div>{branch.notes && <div className="rounded-xl border border-taste-border p-4 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Notes</p><p className="mt-1">{branch.notes}</p></div>}</div></Modal>;
}

function BranchCard({ branch, onView, onEdit, onStatus }) {
  const active = branch.status === "ACTIVE";
  return <ContentCard className="flex h-full flex-col"><div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-taste-teal-soft text-slate-700"><MapPin size={19} /></span><div><h2 className="font-semibold text-slate-900">{branch.name}</h2><p className="text-xs font-medium uppercase tracking-wide text-slate-500">{branch.code}</p></div></div></div><StatusBadge status={active ? "completed" : "inactive"} label={active ? "Active" : "Inactive"} /></div><div className="mt-5 space-y-2 text-sm text-slate-600"><p className="break-words">{branch.address}</p><p className="flex items-center gap-2"><Phone size={15} aria-hidden="true" />{branch.contactNumber}</p><p className="flex items-center gap-2"><Clock3 size={15} aria-hidden="true" />{formatTime(branch.openingTime)} - {formatTime(branch.closingTime)}</p><p>Manager: {branch.managerName || "Not assigned"}</p></div><div className="mt-auto flex flex-wrap gap-2 pt-5"><Button variant="outline" size="sm" onClick={() => onView(branch)}><Eye size={15} />View details</Button><Button variant="ghost" size="sm" onClick={() => onEdit(branch)}><Edit3 size={15} />Edit</Button><Button variant={active ? "ghost" : "subtle"} size="sm" onClick={() => onStatus(branch)}><Power size={15} />{active ? "Deactivate" : "Activate"}</Button></div></ContentCard>;
}

export default function BranchManagement() {
  const { currentUser } = useAuth();
  const { branches: contextBranches, currentBranch, refreshBranches } = useBranch();
  const [branches, setBranches] = useState(contextBranches);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [formBranch, setFormBranch] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });
  const loadBranches = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBranches({ actorRole: currentUser.role });
      setBranches(data);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser.role]);
  useEffect(() => {
    let isMounted = true;
    const request = async () => {
      if (!isMounted) return;
      await loadBranches();
    };
    void request();
    return () => {
      isMounted = false;
    };
  }, [loadBranches]);
  const filtered = useMemo(() => branches.filter((branch) => { const term = search.toLowerCase().trim(); return (!term || `${branch.name} ${branch.code} ${branch.address} ${branch.managerName}`.toLowerCase().includes(term)) && (status === "ALL" || branch.status === status); }), [branches, search, status]);
  const notify = (message, variant = "success") => setToast({ open: true, message, variant });
  const afterSave = async (saved) => { setFormOpen(false); setFormBranch(null); await loadBranches(); refreshBranches(); notify(`${saved.name} ${saved.id === formBranch?.id ? "updated" : "added"} successfully.`); };
  const openStatus = (branch) => { if (branch.status === "ACTIVE" && branch.id === currentBranch?.id) return notify("Switch to another active branch before deactivating the current workspace.", "warning"); if (branch.status === "ACTIVE" && branches.filter((entry) => entry.status === "ACTIVE").length <= 1) return notify("At least one active branch must remain.", "warning"); setPendingStatus(branch); };
  const changeStatus = async () => { try { const nextStatus = pendingStatus.status === "ACTIVE" ? "INACTIVE" : "ACTIVE"; await setBranchStatus(pendingStatus.id, nextStatus, { actorRole: currentUser.role }); setPendingStatus(null); await loadBranches(); refreshBranches(); notify(`${pendingStatus.name} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`); } catch (statusError) { setPendingStatus(null); notify(statusError.message, "danger"); } };
  const hasFilters = search || status !== "ALL";
  if (loading) return <PageContainer><LoadingState label="Loading branches" /></PageContainer>;
  if (error) return <PageContainer><ErrorState title="Branches unavailable" description={error} action={<Button onClick={loadBranches}>Try again</Button>} /></PageContainer>;
  return <PageContainer><PageHeader title="Branch Management" description="Manage Taste It's operating branches and their availability." actions={<Button onClick={() => { setFormBranch(null); setFormOpen(true); }}><Plus size={17} />Add branch</Button>} /><FilterBar className="mt-7"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search branches" aria-label="Search branches" className="sm:max-w-sm" /><Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter branch status" className="sm:max-w-44"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select>{hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatus("ALL"); }}>Clear filters</Button>}</FilterBar><ContentCard className="mt-7"><SectionHeader title="Operating branches" description={`${filtered.length} branch${filtered.length === 1 ? "" : "es"} in view.`} />{filtered.length ? <div className="mt-5 grid gap-4 lg:grid-cols-2">{filtered.map((branch) => <BranchCard key={branch.id} branch={branch} onView={setDetails} onEdit={(item) => { setFormBranch(item); setFormOpen(true); }} onStatus={openStatus} />)}</div> : <div className="mt-5"><EmptyState title="No branches found" description={hasFilters ? "Try adjusting your search or filters." : "Add an operating branch to get started."} action={!hasFilters && <Button onClick={() => setFormOpen(true)}><Plus size={17} />Add branch</Button>} /></div>}</ContentCard><BranchDetails branch={details} onClose={() => setDetails(null)} />{formOpen && <BranchForm branch={formBranch} actorRole={currentUser.role} onClose={() => { setFormOpen(false); setFormBranch(null); }} onSaved={afterSave} />}<ConfirmDialog open={Boolean(pendingStatus)} onClose={() => setPendingStatus(null)} onConfirm={changeStatus} danger={pendingStatus?.status === "ACTIVE"} confirmLabel={pendingStatus?.status === "ACTIVE" ? "Deactivate branch" : "Activate branch"} title={pendingStatus?.status === "ACTIVE" ? "Deactivate branch?" : "Activate branch?"} description={pendingStatus?.status === "ACTIVE" ? `${pendingStatus?.name} will remain in Branch Management but will no longer be available for normal branch selection.` : `${pendingStatus?.name} will become available for branch selection and operations.`} /><Toast open={toast.open} variant={toast.variant} onClose={() => setToast((current) => ({ ...current, open: false }))}>{toast.message}</Toast></PageContainer>;
}
