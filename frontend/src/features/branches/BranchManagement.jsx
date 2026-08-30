import { useCallback, useEffect, useMemo, useState } from "react";
import { Archive, Edit3, MapPin, Phone, Plus, Power, RotateCcw } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import {
  Alert,
  Button,
  ConfirmDialog,
  ContentCard,
  EmptyState,
  ErrorState,
  FormField,
  Input,
  LoadingState,
  Modal,
  SearchInput,
  Select,
  StatusBadge,
  Toast,
} from "../../components/ui";
import {
  FilterBar,
  PageHeader,
  SectionHeader,
} from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import {
  getBranches,
  saveBranch,
  setBranchStatus,
} from "../../services/branchService";

const initialForm = {
  name: "",
  code: "",
  address: "",
  contactNumber: "",
  email: "",
};
const formatDate = (value) =>
  new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
    new Date(value),
  );

function BranchForm({ branch, onClose, onSaved, actorRole }) {
  const [form, setForm] = useState(() =>
    branch ? { ...initialForm, ...branch } : initialForm,
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const change = (field, value) =>
    setForm((current) => ({ ...current, [field]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const saved = await saveBranch(form, { actorRole });
      onSaved(saved);
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={branch ? "Edit branch" : "Add branch"}
      className="max-h-[calc(100vh-1rem)] max-w-3xl overflow-y-auto"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="branch-form" loading={saving}>
            {branch ? "Save changes" : "Add branch"}
          </Button>
        </>
      }
    >
      <form id="branch-form" onSubmit={submit} className="space-y-5">
        <p className="text-sm text-slate-500">
          Required fields are marked with an asterisk.
        </p>
        {error && (
          <Alert variant="danger" title="Unable to save branch">
            {error}
          </Alert>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Branch name" required>
            <Input
              value={form.name}
              onChange={(event) => change("name", event.target.value)}
              required
              placeholder="e.g. Banilad"
            />
          </FormField>
          <FormField
            label="Branch code"
            required
            hint="Use a short unique code."
          >
            <Input
              value={form.code}
              onChange={(event) =>
                change("code", event.target.value.toUpperCase())
              }
              required
              placeholder="e.g. BAN"
            />
          </FormField>
          <FormField label="Address" required>
            <Input
              value={form.address}
              onChange={(event) => change("address", event.target.value)}
              required
              placeholder="Complete branch address"
            />
          </FormField>
          <FormField label="Contact number" required>
            <Input
              value={form.contactNumber}
              onChange={(event) => change("contactNumber", event.target.value)}
              required
              placeholder="+63 917 000 0000"
            />
          </FormField>
          <FormField label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(event) => change("email", event.target.value)}
              placeholder="branch@tasteit.com"
            />
          </FormField>
        </div>
      </form>
    </Modal>
  );
}

function BranchDetails({ branch, onClose, onEdit, onStatus }) {
  if (!branch) return null;
  return (
    <Modal
      open
      onClose={onClose}
      title={`${branch.name} details`}
      className="max-h-[calc(100vh-1rem)] max-w-2xl overflow-y-auto"
      footer={
        <div className="flex flex-wrap gap-2">
          {branch.status !== "ARCHIVED" && (
             <Button variant="ghost" onClick={() => onEdit?.(branch)}>
                <Edit3 size={15} />
                Edit
             </Button>
          )}
          {branch.status !== "ARCHIVED" && (
             <Button variant="outline" onClick={() => onStatus?.(branch, branch.status === "ACTIVE" ? "DEACTIVATED" : "ACTIVE")}>
                <Power size={15} />
                {branch.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
             </Button>
          )}
          {branch.status === "ARCHIVED" ? (
             <Button variant="outline" onClick={() => onStatus?.(branch, "DEACTIVATED")}>
                <RotateCcw size={15} />
                Restore
             </Button>
          ) : (
             <Button variant="subtle" onClick={() => onStatus?.(branch, "ARCHIVED")}>
                <Archive size={15} />
                Archive
             </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold text-slate-900">{branch.name}</p>
            <p className="mt-1 text-sm text-slate-500">{branch.code}</p>
          </div>
          <StatusBadge
            status={branch.status === "ACTIVE" ? "completed" : branch.status === "ARCHIVED" ? "inactive" : "warning"}
            label={branch.status === "ACTIVE" ? "Active" : branch.status === "ARCHIVED" ? "Archived" : "Deactivated"}
          />
        </div>
        <div className="grid gap-5 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <div>
            <p className="font-semibold text-slate-800">Location & contact</p>
            <p className="mt-2 text-slate-600">{branch.address}</p>
            <p className="mt-1 text-slate-600">{branch.contactNumber}</p>
            <p className="mt-1 break-all text-slate-600">
              {branch.email || "No email recorded"}
            </p>
          </div>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <p>
            <span className="text-slate-500">Created:</span>{" "}
            {formatDate(branch.createdAt)}
          </p>
          <p className="sm:col-span-2">
            <span className="text-slate-500">Updated:</span>{" "}
            {formatDate(branch.updatedAt)}
          </p>
        </div>
      </div>
    </Modal>
  );
}

function BranchCard({ branch, onView, onEdit, onStatus }) {
  const active = branch.status === "ACTIVE";
  return (
    <ContentCard as="button" onClick={() => onView(branch)} className="flex h-full flex-col text-left transition hover:-translate-y-0.5 hover:border-taste-teal hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-taste-teal-soft text-slate-700">
              <MapPin size={19} />
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">{branch.name}</h2>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {branch.code}
              </p>
            </div>
          </div>
        </div>
        <StatusBadge
          status={branch.status === "ACTIVE" ? "completed" : branch.status === "ARCHIVED" ? "inactive" : "warning"}
          label={branch.status === "ACTIVE" ? "Active" : branch.status === "ARCHIVED" ? "Archived" : "Deactivated"}
        />
      </div>
      <div className="mt-5 space-y-2 text-sm text-slate-600">
        <p className="break-words">{branch.address}</p>
        <p className="flex items-center gap-2">
          <Phone size={15} aria-hidden="true" />
          {branch.contactNumber}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        
        <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); onEdit(branch); }}>
          <Edit3 size={15} />
          Edit
        </Button>
        <Button
          variant={active ? "ghost" : "subtle"}
          size="sm"
          onClick={() => onStatus(branch)}
        >
          <Power size={15} />
          {active ? "Deactivate" : "Activate"}
        </Button>
      </div>
    </ContentCard>
  );
}

export default function BranchManagement() {
  const { currentUser } = useAuth();
  const {
    branches: contextBranches,
    currentBranch,
    refreshBranches,
  } = useBranch();
  const [branches, setBranches] = useState(contextBranches);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL_OPERATING");
  const [formBranch, setFormBranch] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [toast, setToast] = useState({
    open: false,
    message: "",
    variant: "success",
  });
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
  const filtered = useMemo(
    () =>
      branches.filter((branch) => {
        const term = search.toLowerCase().trim();
        return (
          (!term ||
            `${branch.name} ${branch.code} ${branch.address}`
              .toLowerCase()
              .includes(term)) &&
          (status === "ALL" ? true : status === "ALL_OPERATING" ? branch.status !== "ARCHIVED" : branch.status === status)
        );
      }),
    [branches, search, status],
  );
  const notify = (message, variant = "success") =>
    setToast({ open: true, message, variant });
  const afterSave = async (saved) => {
    setFormOpen(false);
    setFormBranch(null);
    await loadBranches();
    refreshBranches();
    notify(
      `${saved.name} ${saved.id === formBranch?.id ? "updated" : "added"} successfully.`,
    );
  };
  const openStatus = (branch, nextStatus) => {
    if (branch.status === "ACTIVE" && branch.id === currentBranch?.id)
      return notify(
        "Switch to another active branch before deactivating the current workspace.",
        "warning",
      );
    if (
      branch.status === "ACTIVE" &&
      branches.filter((entry) => entry.status === "ACTIVE").length <= 1
    )
      return notify("At least one active branch must remain.", "warning");
    setPendingStatus({ branch, nextStatus });
  };
  const changeStatus = async () => {
    try {
      const nextStatus = pendingStatus?.nextStatus;
      await setBranchStatus(pendingStatus?.branch?.id, nextStatus, {
        actorRole: currentUser.role,
      });
      setPendingStatus(null);
      await loadBranches();
      refreshBranches();
      notify(
        `${pendingStatus?.branch?.name} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`,
      );
    } catch (statusError) {
      setPendingStatus(null);
      notify(statusError.message, "danger");
    }
  };
  const hasFilters = search || status !== "ALL_OPERATING";
  if (loading)
    return (
      <PageContainer>
        <LoadingState label="Loading branches" />
      </PageContainer>
    );
  if (error)
    return (
      <PageContainer>
        <ErrorState
          title="Branches unavailable"
          description={error}
          action={<Button onClick={loadBranches}>Try again</Button>}
        />
      </PageContainer>
    );
  return (
    <PageContainer>
      <PageHeader
        title="Branch Management"
        description="Manage Taste It's operating branches and their availability."
        actions={
          <Button
            onClick={() => {
              setFormBranch(null);
              setFormOpen(true);
            }}
          >
            <Plus size={17} />
            Add branch
          </Button>
        }
      />
      <FilterBar className="mt-7">
        <SearchInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search branches"
          aria-label="Search branches"
          className="sm:max-w-sm"
        />
        <Select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter branch status"
          className="sm:max-w-44"
        >
          <option value="ALL">All statuses</option>
          <option value="ALL_OPERATING">All operating</option>
          <option value="ACTIVE">Active</option>
          <option value="DEACTIVATED">Deactivated</option>
          <option value="ARCHIVED">Archived</option>
        </Select>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSearch("");
              setStatus("ALL_OPERATING");
            }}
          >
            Clear filters
          </Button>
        )}
      </FilterBar>
      <ContentCard className="mt-7">
        <SectionHeader
          title="Operating branches"
          description={`${filtered.length} branch${filtered.length === 1 ? "" : "es"} in view.`}
        />
        {filtered.length ? (
          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            {filtered.map((branch) => (
              <BranchCard
                key={branch.id}
                branch={branch}
                onView={setDetails}
                onEdit={(item) => {
                  setFormBranch(item);
                  setFormOpen(true);
                }}
                onStatus={openStatus}
              />
            ))}
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState
              title="No branches found"
              description={
                hasFilters
                  ? "Try adjusting your search or filters."
                  : "Add an operating branch to get started."
              }
              action={
                !hasFilters && (
                  <Button onClick={() => setFormOpen(true)}>
                    <Plus size={17} />
                    Add branch
                  </Button>
                )
              }
            />
          </div>
        )}
      </ContentCard>
      <BranchDetails branch={details} onClose={() => setDetails(null)} onEdit={(item) => { setDetails(null); setFormBranch(item); setFormOpen(true); }} onStatus={(b, s) => { setDetails(null); openStatus(b, s); }} />
      {formOpen && (
        <BranchForm
          branch={formBranch}
          actorRole={currentUser.role}
          onClose={() => {
            setFormOpen(false);
            setFormBranch(null);
          }}
          onSaved={afterSave}
        />
      )}
      <ConfirmDialog
        open={Boolean(pendingStatus)}
        onClose={() => setPendingStatus(null)}
        onConfirm={changeStatus}
        danger={pendingStatus?.nextStatus === "ARCHIVED" || pendingStatus?.nextStatus === "DEACTIVATED"}
        confirmLabel={
          pendingStatus?.nextStatus === "ARCHIVED" ? "Archive branch" :
          pendingStatus?.nextStatus === "DEACTIVATED" ? "Deactivate branch" :
          pendingStatus?.nextStatus === "ACTIVE" ? "Reactivate branch" : "Restore branch"
        }
        title={
          pendingStatus?.nextStatus === "ARCHIVED" ? "Archive branch?" :
          pendingStatus?.nextStatus === "DEACTIVATED" ? "Deactivate branch?" :
          pendingStatus?.nextStatus === "ACTIVE" ? "Reactivate branch?" : "Restore branch?"
        }
        description={
          pendingStatus?.nextStatus === "ARCHIVED" ? `${pendingStatus?.branch?.name} will be hidden from the default list and assigned users will be blocked from access. Historical data is preserved.` :
          pendingStatus?.nextStatus === "DEACTIVATED" ? `${pendingStatus?.branch?.name} will be marked as deactivated and assigned users will be temporarily blocked from access.` :
          pendingStatus?.nextStatus === "ACTIVE" ? `${pendingStatus?.branch?.name} will become fully active again.` :
          `${pendingStatus?.branch?.name} will be restored as deactivated. You can activate it later.`
        }
      />
      <Toast
        open={toast.open}
        variant={toast.variant}
        onClose={() => setToast((current) => ({ ...current, open: false }))}
      >
        {toast.message}
      </Toast>
    </PageContainer>
  );
}
