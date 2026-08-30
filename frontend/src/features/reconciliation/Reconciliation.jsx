import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  ClipboardList,
  PackageSearch,
  Store,
  TriangleAlert,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import {
  Button,
  ConfirmDialog,
  ContentCard,
  Drawer,
  Dropdown,
  EmptyState,
  ErrorState,
  Input,
  LoadingState,
  Modal,
  SearchInput,
  Select,
  StatusBadge,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Textarea,
  Toast,
} from "../../components/ui";
import PageContainer from "../../components/layout/PageContainer";
import { getInventory, getReconciliationReasons } from "../../services/inventoryService";
import {
  createReconciliation,
  getReconciliationRecords,
  submitReconciliation,
} from "../../services/reconciliationService";
import { cn } from "../../utils/cn";
import {
  buildReasonText,
  getCountVariance,
  normalizeCountInput,
  parseSelectedInventoryItems,
  summarizeCountItems,
  summarizeReconciliationRecords,
} from "../../utils/reconciliation";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const numberFormat = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });

function formatQuantity(quantity, unit) {
  return `${numberFormat.format(quantity)} ${unit}`;
}

function signed(value, unit) {
  return `${value > 0 ? "+" : ""}${numberFormat.format(value)} ${unit}`;
}

function SummaryCard({ label, value, status = "neutral", icon: iconOverride }) {
  const config = {
    neutral: {
      bg: "bg-gradient-to-br from-white to-slate-50 border-slate-200",
      text: "text-slate-800",
      icon: "text-slate-400 bg-slate-100",
      Icon: ClipboardList,
    },
    success: {
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200",
      text: "text-emerald-800",
      icon: "text-emerald-600 bg-emerald-100",
      Icon: CheckCircle2,
    },
    info: {
      bg: "bg-gradient-to-br from-sky-50 to-indigo-50 border-sky-200",
      text: "text-sky-800",
      icon: "text-sky-600 bg-sky-100",
      Icon: PackageSearch,
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
      text: "text-amber-800",
      icon: "text-amber-600 bg-amber-100",
      Icon: TriangleAlert,
    },
  };

  const { bg, text, icon, Icon: defaultIcon } = config[status] ?? config.neutral;
  const Icon = iconOverride || defaultIcon;

  return (
    <div className={`w-full rounded-2xl border p-4 shadow-sm ${bg}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className={`mt-1.5 text-3xl font-extrabold tabular-nums ${text}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${icon}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function SelectionCheckbox({ checked, onChange, label }) {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="h-4 w-4 rounded border-slate-300 accent-taste-purple"
    />
  );
}

function CountStatusBadge({ item }) {
  if (item.physicalQuantity === null || item.physicalQuantity === "") {
    return <StatusBadge status="pending" label="Pending" />;
  }
  if (item.variance === 0) {
    return <StatusBadge status="completed" label="Matched" />;
  }
  return <StatusBadge status="warning" label={item.variance > 0 ? "Excess" : "Shortage"} />;
}

function VarianceBadge({ variance }) {
  if (variance === 0) {
    return <StatusBadge status="completed" label="Matched" />;
  }
  return <StatusBadge status="warning" label={variance > 0 ? "Excess" : "Shortage"} />;
}

function CountModal({ draft, reasons, branchName, onClose, onSubmit }) {
  const [items, setItems] = useState(draft.items);
  const [reasonId, setReasonId] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [error, setError] = useState("");

  const selectedReason = reasons.find((reason) => reason.id === reasonId) || null;
  const isOtherReason = selectedReason?.reason_type === "other";
  const summary = useMemo(() => summarizeCountItems(items), [items]);

  const updateItem = (index, changes) => {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...changes } : item)));
  };

  const handleSubmit = () => {
    if (!reasonId) {
      setError("Select a reconciliation reason.");
      return;
    }

    if (isOtherReason && !otherReason.trim()) {
      setError("Please specify the custom reconciliation reason.");
      return;
    }

    const invalidItem = items.find((item) => Number.isNaN(normalizeCountInput(item.physicalQuantity)));
    if (invalidItem) {
      setError(`Enter a valid non-negative count for ${invalidItem.name}.`);
      return;
    }

    const missingCount = items.find((item) => item.physicalQuantity === null || item.physicalQuantity === "");
    if (missingCount) {
      setError(`Count every selected item before submitting. Missing count for ${missingCount.name}.`);
      return;
    }

    const invalidOverride = items.find(
      (item) => item.overrideReasonType === "other" && !item.overrideOtherReason?.trim()
    );
    if (invalidOverride) {
      setError(`Please specify the custom item reason for ${invalidOverride.name}.`);
      return;
    }

    setError("");
    onSubmit(items, {
      reasonId,
      reasonType: selectedReason.reason_type,
      reasonLabel: selectedReason.label,
      otherReason: otherReason.trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={draft.scopeType === "full" ? "Start Full Reconciliation" : "Start Targeted Reconciliation"}
      className="flex max-h-[90vh] w-[95vw] max-w-[1180px] flex-col"
      footer={
        <div className="flex w-full items-center justify-between">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} className="bg-taste-purple text-white hover:bg-taste-purple-strong">
            <ClipboardCheck size={16} />
            Review Submission
          </Button>
        </div>
      }
    >
      <div className="flex h-full flex-col gap-4 overflow-hidden">
        {error ? (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm md:grid-cols-4">
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Branch</span>
            <span className="mt-1 block font-medium text-slate-900">{branchName}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Mode</span>
            <span className="mt-1 block font-medium text-slate-900">
              {draft.scopeType === "full" ? "Full Count" : "Targeted Count"}
            </span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Started By</span>
            <span className="mt-1 block font-medium text-slate-900">{draft.performedBy.name}</span>
          </div>
          <div>
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">Items Included</span>
            <span className="mt-1 block font-medium text-slate-900">{draft.items.length}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-900">Reconciliation Reason</span>
            <Select value={reasonId} onChange={(event) => setReasonId(event.target.value)}>
              <option value="">Select reason</option>
              {reasons.map((reason) => (
                <option key={reason.id} value={reason.id}>
                  {reason.label}
                </option>
              ))}
            </Select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-semibold text-slate-900">Custom Reason</span>
            <Textarea
              value={otherReason}
              onChange={(event) => setOtherReason(event.target.value.substring(0, 250))}
              disabled={!isOtherReason}
              placeholder={isOtherReason ? "Required when Other is selected." : "Available when Other is selected."}
              className="min-h-[72px]"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <SummaryCard label="Items" value={summary.total} status="neutral" icon={ClipboardList} />
          <SummaryCard label="Counted" value={summary.counted} status="info" icon={Store} />
          <SummaryCard label="Matched" value={summary.matched} status="success" icon={CheckCircle2} />
          <SummaryCard label="Shortages" value={summary.shortages} status="warning" icon={TriangleAlert} />
          <SummaryCard label="Excesses" value={summary.excesses} status="info" icon={PackageSearch} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[1080px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-xs uppercase tracking-wide text-slate-500 shadow-sm">
              <tr>
                <th className="px-4 py-3 font-semibold">Item</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">System Qty</th>
                <th className="px-4 py-3 font-semibold">Counted Qty</th>
                <th className="px-4 py-3 font-semibold">Variance</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Item Override</th>
                <th className="px-4 py-3 font-semibold">Item Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <tr key={item.ingredientId} className="transition-colors hover:bg-slate-50">
                  <td className="px-4 py-3 font-semibold text-slate-900">{item.name}</td>
                  <td className="px-4 py-3 text-slate-500">{item.category}</td>
                  <td className="px-4 py-3 text-slate-600">{formatQuantity(item.systemQuantity, item.unit)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={item.physicalQuantity ?? ""}
                        onChange={(event) => {
                          const parsedValue = normalizeCountInput(event.target.value);
                          updateItem(index, {
                            physicalQuantity: event.target.value === "" ? null : event.target.value,
                            variance: getCountVariance(item.systemQuantity, parsedValue),
                          });
                        }}
                        className="h-8 w-24 text-right text-[13px]"
                      />
                      <span className="text-[11px] text-slate-500">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.variance === null ? (
                      <span className="text-slate-300">-</span>
                    ) : (
                      <span
                        className={cn(
                          "font-medium",
                          item.variance === 0
                            ? "text-slate-500"
                            : item.variance > 0
                              ? "text-sky-600"
                              : "text-rose-600"
                        )}
                      >
                        {signed(item.variance, item.unit)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CountStatusBadge item={item} />
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={item.overrideReasonId}
                      onChange={(event) => {
                        const override = reasons.find((reason) => reason.id === event.target.value);
                        updateItem(index, {
                          overrideReasonId: event.target.value,
                          overrideReasonType: override?.reason_type || "",
                          overrideReasonLabel: override?.label || "",
                          overrideOtherReason: "",
                        });
                      }}
                      className="h-8"
                    >
                      <option value="">Use reconciliation reason</option>
                      {reasons.map((reason) => (
                        <option key={reason.id} value={reason.id}>
                          {reason.label}
                        </option>
                      ))}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    <Input
                      value={item.overrideOtherReason}
                      onChange={(event) => updateItem(index, { overrideOtherReason: event.target.value })}
                      disabled={item.overrideReasonType !== "other"}
                      placeholder={item.overrideReasonType === "other" ? "Required for Other" : "Optional"}
                      className="h-8 text-[12px]"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Modal>
  );
}

export default function Reconciliation() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const [searchParams] = useSearchParams();
  const requestedMode = searchParams.get("mode") === "targeted" ? "targeted" : "full";
  const requestedItemsStr = searchParams.get("items");
  const requestedItemIds = useMemo(() => parseSelectedInventoryItems(requestedItemsStr), [requestedItemsStr]);

  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedBranchId, setLoadedBranchId] = useState(null);
  const [error, setError] = useState("");

  const [mode, setMode] = useState(requestedMode);
  const [itemSearch, setItemSearch] = useState("");
  const [selectedItemIds, setSelectedItemIds] = useState(requestedItemIds);
  const [recordSearch, setRecordSearch] = useState("");
  const [resultFilter, setResultFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [activeDraft, setActiveDraft] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const load = useCallback(async () => {
    if (!currentBranch?.id) return;

    setLoading(true);
    try {
      const [recordData, inventoryData, reasonData] = await Promise.all([
        getReconciliationRecords(currentBranch.id),
        getInventory(currentBranch.id),
        getReconciliationReasons(),
      ]);
      setRecords(recordData);
      setInventory(inventoryData.filter((item) => item.active));
      setReasons(reasonData);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadedBranchId(currentBranch.id);
      setLoading(false);
    }
  }, [currentBranch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const urlSyncRef = useRef("");

  useEffect(() => {
    if (inventory.length === 0) return;

    const syncKey = `${requestedMode}:${requestedItemsStr}`;
    if (urlSyncRef.current === syncKey) return;
    urlSyncRef.current = syncKey;

    const validIds = requestedItemIds.filter((id) => inventory.some((item) => item.id === id));
    const timer = setTimeout(() => {
      setMode(requestedMode);
      setSelectedItemIds(validIds);
    }, 0);
    return () => clearTimeout(timer);
  }, [inventory, requestedMode, requestedItemsStr, requestedItemIds]);

  const selectableItems = useMemo(() => {
    const term = itemSearch.trim().toLowerCase();
    return inventory.filter((item) => {
      if (!term) return true;
      return `${item.name} ${item.category} ${item.description || ""}`.toLowerCase().includes(term);
    });
  }, [inventory, itemSearch]);

  const selectedItems = useMemo(
    () => inventory.filter((item) => selectedItemIds.includes(item.id)),
    [inventory, selectedItemIds]
  );

  const recordSummary = useMemo(() => summarizeReconciliationRecords(records), [records]);

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const term = recordSearch.trim().toLowerCase();
      const matchesSearch =
        !term ||
        record.reasonText.toLowerCase().includes(term) ||
        record.performedBy.name.toLowerCase().includes(term) ||
        record.itemName.toLowerCase().includes(term) ||
        record.id.toLowerCase().includes(term);

      const matchesResult =
        resultFilter === "ALL" ||
        (resultFilter === "MATCHED" && record.variance === 0) ||
        (resultFilter === "SHORTAGE" && record.variance < 0) ||
        (resultFilter === "EXCESS" && record.variance > 0);

      let matchesDate = true;
      if (dateFilter !== "ALL") {
        const recordDate = new Date(record.createdAt);
        const now = new Date();
        const diffDays = Math.floor((now - recordDate) / (1000 * 60 * 60 * 24));

        if (dateFilter === "TODAY") matchesDate = diffDays === 0;
        else if (dateFilter === "LAST_7_DAYS") matchesDate = diffDays <= 7;
        else if (dateFilter === "LAST_30_DAYS") matchesDate = diffDays <= 30;
        else if (dateFilter === "THIS_MONTH") {
          matchesDate = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesResult && matchesDate;
    });
  }, [dateFilter, recordSearch, records, resultFilter]);

  const allVisibleSelected =
    selectableItems.length > 0 && selectableItems.every((item) => selectedItemIds.includes(item.id));

  const toggleSelectedItem = (itemId) => {
    setSelectedItemIds((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  };

  const toggleVisibleItemSelection = () => {
    const visibleIds = selectableItems.map((item) => item.id);
    setSelectedItemIds((current) => {
      if (visibleIds.every((id) => current.includes(id))) {
        return current.filter((id) => !visibleIds.includes(id));
      }
      return [...new Set([...current, ...visibleIds])];
    });
  };

  const startReconciliation = async () => {
    if (!currentBranch?.id || !currentUser) {
      notify("Select a branch and sign in before starting reconciliation.", "danger");
      return;
    }

    if (!reasons.length) {
      notify("No reconciliation reasons are available right now.", "danger");
      return;
    }

    try {
      const draft = await createReconciliation(currentBranch.id, currentUser, {
        scopeType: mode,
        selectedItemIds,
      });
      setActiveDraft(draft);
    } catch (startError) {
      notify(startError.message, "danger");
    }
  };

  const submit = async () => {
    try {
      await submitReconciliation(
        currentBranch.id,
        { ...confirmSubmit.draft, items: confirmSubmit.items },
        confirmSubmit.reason,
        currentUser
      );
      setConfirmSubmit(null);
      setActiveDraft(null);
      setSelectedItemIds([]);
      await load();
      notify("Reconciliation submitted successfully.");
    } catch (submitError) {
      setConfirmSubmit(null);
      notify(submitError.message, "danger");
    }
  };

  if (loading || loadedBranchId !== currentBranch?.id) {
    return (
      <PageContainer>
        <LoadingState label="Loading reconciliations" />
      </PageContainer>
    );
  }

  if (error || !currentBranch) {
    return (
      <PageContainer>
        <ErrorState title="Reconciliation unavailable" description={error || "Select a branch to continue."} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-taste-heading">Inventory Reconciliation</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {recordSummary.totalRecords} recorded entries in {currentBranch.name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Records" value={recordSummary.totalRecords} status="neutral" icon={ClipboardList} />
        <SummaryCard label="Matched" value={recordSummary.matched} status="success" icon={CheckCircle2} />
        <SummaryCard label="Shortages" value={recordSummary.shortages} status="warning" icon={TriangleAlert} />
        <SummaryCard label="Excesses" value={recordSummary.excesses} status="info" icon={PackageSearch} />
      </div>

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-xl font-extrabold text-slate-900">Start Reconciliation</h2>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Match the same working style as Inventory: count the whole branch when needed, or select only the items you want to verify.
            </p>
          </div>
          <div className="grid min-w-[220px] grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                mode === "full" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              )}
              onClick={() => setMode("full")}
            >
              Full Count
            </button>
            <button
              type="button"
              className={cn(
                "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
                mode === "targeted" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              )}
              onClick={() => setMode("targeted")}
            >
              Targeted Count
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            {mode === "full" ? (
              <>
                <p className="text-sm font-semibold text-slate-900">Full branch reconciliation</p>
                <p className="mt-1 text-sm text-slate-500">
                  This count includes all {inventory.length} active inventory items in the current branch.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm font-semibold text-slate-900">Targeted reconciliation</p>
                <p className="mt-1 text-sm text-slate-500">
                  Select one or more items below. Only selected items will be counted and submitted.
                </p>
              </>
            )}
          </div>
          <Button
            className="bg-taste-purple text-white hover:bg-taste-purple-strong"
            disabled={mode === "targeted" && selectedItemIds.length === 0}
            onClick={startReconciliation}
          >
            <ClipboardCheck size={16} />
            Start {mode === "full" ? "Full" : "Targeted"} Reconciliation
          </Button>
        </div>

        {mode === "targeted" ? (
          <div className="mt-5 space-y-4">
            <div className="flex flex-col md:flex-row gap-3 rounded-2xl bg-white p-3 shadow-sm border border-slate-200">
              <div className="flex-1 min-w-[240px]">
                <SearchInput
                  value={itemSearch}
                  onChange={(event) => setItemSearch(event.target.value)}
                  placeholder="Search inventory items to reconcile..."
                  aria-label="Search inventory items for targeted reconciliation"
                  className="w-full border-none shadow-none bg-slate-50"
                />
              </div>
              <div className="h-px w-full md:h-10 md:w-px bg-slate-100 hidden md:block" />
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" onClick={toggleVisibleItemSelection}>
                  {allVisibleSelected ? "Clear visible" : "Select visible"}
                </Button>
                <span className="text-sm text-slate-500">{selectedItemIds.length} selected</span>
              </div>
            </div>

            <ContentCard className="overflow-hidden p-0">
              {selectableItems.length ? (
                <div className="overflow-x-auto">
                  <Table className="min-w-[760px]">
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableCell as="th" className="w-12 px-4 py-3">
                          <SelectionCheckbox
                            checked={allVisibleSelected}
                            onChange={toggleVisibleItemSelection}
                            label="Select visible targeted reconciliation items"
                          />
                        </TableCell>
                        <TableCell as="th">Item</TableCell>
                        <TableCell as="th">Category</TableCell>
                        <TableCell as="th">Current Stock</TableCell>
                        <TableCell as="th">Low Stock Alert</TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectableItems.map((item) => (
                        <TableRow key={item.id} className="hover:bg-slate-50">
                          <TableCell className="px-4 py-3">
                            <SelectionCheckbox
                              checked={selectedItemIds.includes(item.id)}
                              onChange={() => toggleSelectedItem(item.id)}
                              label={`Select ${item.name} for targeted reconciliation`}
                            />
                          </TableCell>
                          <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                          <TableCell className="text-slate-500">{item.category}</TableCell>
                          <TableCell className="text-slate-700">
                            {formatQuantity(item.currentQuantity, item.unit)}
                          </TableCell>
                          <TableCell className="text-slate-500">
                            {formatQuantity(item.lowStockThreshold, item.unit)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8">
                  <EmptyState
                    title="No inventory items found"
                    description="Try changing your targeted reconciliation search."
                  />
                </div>
              )}
            </ContentCard>

            {selectedItems.length ? (
              <div className="rounded-2xl border border-taste-purple/20 bg-taste-purple-soft p-4">
                <p className="text-sm font-semibold text-slate-900">Selected Items</p>
                <p className="mt-1 text-sm text-slate-500">{selectedItems.map((item) => item.name).join(", ")}</p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4 rounded-2xl bg-white p-3 shadow-sm border border-slate-200">
        <div className="flex-1 min-w-[240px]">
          <SearchInput
            value={recordSearch}
            onChange={(event) => setRecordSearch(event.target.value)}
            placeholder="Search reconciliation history..."
            aria-label="Search reconciliation records"
            className="w-full border-none shadow-none bg-slate-50"
          />
        </div>
        <div className="h-px w-full md:h-10 md:w-px bg-slate-100 hidden md:block" />
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative w-full max-w-[220px] min-w-[150px] flex-1 sm:w-auto">
            <Button
              variant="outline"
              className="w-full justify-between bg-white text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                setActiveDropdown(activeDropdown === "result" ? null : "result");
              }}
            >
              <span>
                {resultFilter === "ALL"
                  ? "All Results"
                  : resultFilter === "MATCHED"
                    ? "Matched"
                    : resultFilter === "SHORTAGE"
                      ? "Shortages"
                      : "Excesses"}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </Button>
            <Dropdown open={activeDropdown === "result"} className="left-0 w-full min-w-48 p-2">
              {[
                { value: "ALL", label: "All Results" },
                { value: "MATCHED", label: "Matched" },
                { value: "SHORTAGE", label: "Shortages" },
                { value: "EXCESS", label: "Excesses" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    setResultFilter(option.value);
                    setActiveDropdown(null);
                  }}
                >
                  <span
                    className={cn(
                      resultFilter === option.value ? "font-semibold text-taste-purple" : "text-slate-700"
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </Dropdown>
          </div>

          <div className="relative w-full max-w-[220px] min-w-[150px] flex-1 sm:w-auto">
            <Button
              variant="outline"
              className="w-full justify-between bg-white text-slate-700"
              onClick={(event) => {
                event.stopPropagation();
                setActiveDropdown(activeDropdown === "date" ? null : "date");
              }}
            >
              <span>
                {dateFilter === "ALL"
                  ? "All Dates"
                  : dateFilter === "TODAY"
                    ? "Today"
                    : dateFilter === "LAST_7_DAYS"
                      ? "Last 7 Days"
                      : dateFilter === "LAST_30_DAYS"
                        ? "Last 30 Days"
                        : "This Month"}
              </span>
              <ChevronDown size={16} className="text-slate-400" />
            </Button>
            <Dropdown open={activeDropdown === "date"} className="left-0 w-full min-w-48 p-2">
              {[
                { value: "ALL", label: "All Dates" },
                { value: "TODAY", label: "Today" },
                { value: "LAST_7_DAYS", label: "Last 7 Days" },
                { value: "LAST_30_DAYS", label: "Last 30 Days" },
                { value: "THIS_MONTH", label: "This Month" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50"
                  onClick={() => {
                    setDateFilter(option.value);
                    setActiveDropdown(null);
                  }}
                >
                  <span
                    className={cn(
                      dateFilter === option.value ? "font-semibold text-taste-purple" : "text-slate-700"
                    )}
                  >
                    {option.label}
                  </span>
                </button>
              ))}
            </Dropdown>
          </div>
        </div>
      </div>

      <ContentCard className="overflow-hidden p-0">
        {filteredRecords.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[980px]">
              <TableHeader>
                <TableRow>
                  <TableCell as="th">Date & Time</TableCell>
                  <TableCell as="th">Item</TableCell>
                  <TableCell as="th">System Qty</TableCell>
                  <TableCell as="th">Counted Qty</TableCell>
                  <TableCell as="th">Variance</TableCell>
                  <TableCell as="th">Reason</TableCell>
                  <TableCell as="th">Performed By</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow
                    key={record.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50"
                    onClick={() => setSelectedRecord(record)}
                  >
                    <TableCell className="whitespace-nowrap text-slate-500">
                      {dateFormat.format(new Date(record.createdAt))}
                    </TableCell>
                    <TableCell>
                      <span className="block font-semibold text-slate-900">{record.itemName}</span>
                      <span className="block text-xs text-slate-500">{record.category}</span>
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatQuantity(record.systemQuantity, record.unit)}
                    </TableCell>
                    <TableCell className="text-slate-700">
                      {formatQuantity(record.physicalQuantity, record.unit)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "font-medium",
                            record.variance === 0
                              ? "text-slate-500"
                              : record.variance > 0
                                ? "text-sky-600"
                                : "text-rose-600"
                          )}
                        >
                          {signed(record.variance, record.unit)}
                        </span>
                        <VarianceBadge variance={record.variance} />
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">{record.reasonText}</TableCell>
                    <TableCell>
                      <span className="block text-slate-900">{record.performedBy.name}</span>
                      <span className="block text-xs text-slate-500">
                        {record.performedBy.role === "OWNER" ? "Owner / Manager" : "Staff"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState
              title="No reconciliation records found"
              description="Try changing the filters or start a new reconciliation."
            />
          </div>
        )}
      </ContentCard>

      {selectedRecord ? (
        <Drawer
          open
          onClose={() => setSelectedRecord(null)}
          title="Reconciliation Record"
          footer={
            <Button
              className="w-full bg-taste-purple text-white hover:bg-taste-purple-strong"
              onClick={() => setSelectedRecord(null)}
            >
              Close
            </Button>
          }
        >
          <div className="space-y-6 p-1">
            <div className="grid grid-cols-2 gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Record ID</span>
                <span className="mt-1 block font-medium text-slate-900">{selectedRecord.id}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Branch</span>
                <span className="mt-1 block font-medium text-slate-900">{currentBranch.name}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Performed By</span>
                <span className="mt-1 block font-medium text-slate-900">{selectedRecord.performedBy.name}</span>
              </div>
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Date & Time</span>
                <span className="mt-1 block font-medium text-slate-900">
                  {dateFormat.format(new Date(selectedRecord.createdAt))}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-bold text-slate-900">{selectedRecord.itemName}</h4>
                  <p className="text-sm text-slate-500">{selectedRecord.category}</p>
                </div>
                <VarianceBadge variance={selectedRecord.variance} />
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">System Qty</span>
                  <span className="mt-1 block font-medium text-slate-900">
                    {formatQuantity(selectedRecord.systemQuantity, selectedRecord.unit)}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Counted Qty</span>
                  <span className="mt-1 block font-medium text-slate-900">
                    {formatQuantity(selectedRecord.physicalQuantity, selectedRecord.unit)}
                  </span>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <span className="block text-xs font-semibold uppercase tracking-wider text-slate-500">Variance</span>
                  <span
                    className={cn(
                      "mt-1 block font-medium",
                      selectedRecord.variance === 0
                        ? "text-slate-900"
                        : selectedRecord.variance > 0
                          ? "text-sky-600"
                          : "text-rose-600"
                    )}
                  >
                    {signed(selectedRecord.variance, selectedRecord.unit)}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-slate-900">Reason</h4>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                {selectedRecord.reasonText}
              </div>
            </div>
          </div>
        </Drawer>
      ) : null}

      {activeDraft ? (
        <CountModal
          draft={activeDraft}
          reasons={reasons}
          branchName={currentBranch.name}
          onClose={() => setActiveDraft(null)}
          onSubmit={(items, reason) => setConfirmSubmit({ draft: activeDraft, items, reason })}
        />
      ) : null}

      {confirmSubmit ? (
        <ConfirmDialog
          open
          onClose={() => setConfirmSubmit(null)}
          onConfirm={submit}
          title="Submit reconciliation?"
          description={`${confirmSubmit.items.length} item(s) will be submitted for ${
            confirmSubmit.draft.scopeType === "full" ? "a full count" : "a targeted count"
          } using "${buildReasonText(confirmSubmit.reason.reasonLabel, confirmSubmit.reason.otherReason)}".`}
          confirmLabel="Submit reconciliation"
        />
      ) : null}

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
