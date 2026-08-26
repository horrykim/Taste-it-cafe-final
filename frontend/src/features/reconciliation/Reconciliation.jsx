import { useEffect, useMemo, useState } from "react";
import { Check, CheckCircle2, ChevronDown, ClipboardCheck, FilePenLine, TriangleAlert, Store, User, Calendar, ClipboardList, Clock, ArrowDown, ArrowUp, Circle, CircleCheck, CircleMinus, CirclePlus } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Button, ConfirmDialog, ContentCard, Drawer, Dropdown, EmptyState, ErrorState, Input, LoadingState, Modal, SearchInput, StatCard, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow, Toast } from "../../components/ui";
import { FilterBar, ResponsiveGrid } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { applyAdjustment, createReconciliation, getReconciliations, saveDraft, submitReconciliation } from "../../services/mock/mockReconciliationService";
import { getInventory } from "../../services/mock/mockInventoryService";
import { cn } from "../../utils/cn";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const numberFormat = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });
const formatQuantity = (quantity, unit) => `${numberFormat.format(quantity)} ${unit}`;
const signed = (value, unit) => `${value > 0 ? "+" : ""}${numberFormat.format(value)} ${unit}`;

function getItemStatus(item) {
  if (item.reconciliationStatus === "DRAFT") return "pending";
  if (item.physicalQuantity === null || item.physicalQuantity === undefined) return "pending";
  if (item.variance === 0) return "matched";
  return "discrepancy";
}

function ItemStatusBadge({ status }) {
  if (status === "pending") return <StatusBadge status="pending" label="Pending" />;
  if (status === "matched") return <StatusBadge status="completed" label="Matched" />;
  if (status === "discrepancy") return <StatusBadge status="warning" label="Discrepancy" />;
  return null;
}

function countStatus(item) {
  if (item.physicalQuantity === null || item.physicalQuantity === "") return { label: "Not counted", variant: "neutral", icon: Circle };
  if (item.variance === 0) return { label: "Matched", variant: "success", icon: CircleCheck };
  return item.variance > 0 ? { label: "Excess", variant: "info", icon: CirclePlus } : { label: "Shortage", variant: "warning", icon: CircleMinus };
}

function CountBadge({ item }) { 
  const state = countStatus(item);
  const Icon = state.icon;
  const colors = {
    neutral: "text-slate-500",
    success: "text-emerald-600",
    warning: "text-rose-500",
    info: "text-sky-600"
  };
  return (
    <div className={`flex items-center gap-1.5 font-medium ${colors[state.variant]}`}>
      <Icon size={14} className="stroke-2" />
      <span>{state.label}</span>
    </div>
  );
}

function VarianceSummary({ items }) {
  const summary = useMemo(() => {
    const counted = items.filter((item) => item.physicalQuantity !== null && item.physicalQuantity !== "");
    return { total: items.length, counted: counted.length, matched: counted.filter((item) => item.variance === 0).length, shortages: counted.filter((item) => item.variance < 0).length, excesses: counted.filter((item) => item.variance > 0).length };
  }, [items]);
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
      <div className="rounded-xl border border-taste-border bg-white p-3 flex items-center justify-between shadow-sm">
        <div><p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Total Items</p><p className="text-lg font-bold text-slate-900">{summary.total}</p></div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-taste-pink"><ClipboardList size={16} /></div>
      </div>
      <div className="rounded-xl border border-taste-border bg-white p-3 flex items-center justify-between shadow-sm">
        <div><p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Counted</p><p className="text-lg font-bold text-slate-900">{summary.counted}</p></div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500"><CheckCircle2 size={16} /></div>
      </div>
      <div className="rounded-xl border border-taste-border bg-white p-3 flex items-center justify-between shadow-sm">
        <div><p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Uncounted</p><p className="text-lg font-bold text-slate-900">{summary.total - summary.counted}</p></div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-500"><Clock size={16} /></div>
      </div>
      <div className="rounded-xl border border-taste-border bg-white p-3 flex items-center justify-between shadow-sm">
        <div><p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Matched</p><p className="text-lg font-bold text-slate-900">{summary.matched}</p></div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-500"><CheckCircle2 size={16} /></div>
      </div>
      <div className="rounded-xl border border-taste-border bg-white p-3 flex items-center justify-between shadow-sm">
        <div><p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Shortages</p><p className="text-lg font-bold text-slate-900">{summary.shortages}</p></div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-orange-500"><ArrowDown size={16} /></div>
      </div>
      <div className="rounded-xl border border-taste-border bg-white p-3 flex items-center justify-between shadow-sm">
        <div><p className="text-[11px] uppercase tracking-wide text-slate-500 font-semibold">Excesses</p><p className="text-lg font-bold text-slate-900">{summary.excesses}</p></div>
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-500"><ArrowUp size={16} /></div>
      </div>
    </div>
  );
}

function CountModal({ record, onClose, onSubmit }) {
  const [items, setItems] = useState(record.items);
  const [reason, setReason] = useState(record.reason || "");
  const [error, setError] = useState("");

  const change = (index, field, value) => setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: field === "physicalQuantity" ? (value === "" ? null : value) : value, variance: field === "physicalQuantity" ? (value === "" ? null : Number(value) - item.systemQuantity) : item.variance } : item));
  
  
  
  const submit = () => { 
    const uncounted = items.some((item) => item.physicalQuantity === null || item.physicalQuantity === ""); 
    if (!reason || reason.trim() === "") return setError("Please provide a reason or description for this reconciliation.");
    if (uncounted) return setError("Count every item before submitting."); 
    onSubmit(items, reason); 
  };
  
  return (
    <Modal 
      open 
      onClose={onClose} 
      title={`Start Reconciliation`} 
      className="w-[95vw] max-w-[1000px] max-h-[90vh] flex flex-col" 
      footer={<div className="flex w-full justify-between items-center"><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={submit} className="bg-taste-pink hover:bg-taste-pink-strong text-white"><ClipboardCheck size={16} />Start Reconciliation</Button></div>}
    >
      <div className="flex flex-col h-full overflow-hidden space-y-4">
        {error && <div className="shrink-0"><p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p></div>}
        <div className="shrink-0 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm bg-white p-2 rounded-xl border border-taste-border shadow-sm mb-2">
          <div className="flex items-center gap-3 p-1">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pink-50 text-taste-pink"><Store size={16} /></div>
            <div>
              <span className="block text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Branch</span>
              <span className="capitalize font-medium text-slate-900 text-sm">{record.branchId}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-1 sm:border-l border-taste-border sm:pl-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-taste-purple"><User size={16} /></div>
            <div>
              <span className="block text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Started By</span>
              <span className="block font-medium text-slate-900 text-sm leading-tight">{record.performedBy?.name}</span>
              <span className="block text-[11px] text-slate-500">{record.performedBy?.role === "OWNER" ? "Owner / Manager" : record.performedBy?.role === "STAFF" ? "Staff" : record.performedBy?.role || "—"}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 p-1 sm:border-l border-taste-border sm:pl-4">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-500"><Calendar size={16} /></div>
            <div>
              <span className="block text-slate-500 text-[11px] font-semibold uppercase tracking-wider mb-0.5">Date & Time</span>
              <span className="font-medium text-slate-900 text-sm">{dateFormat.format(new Date(record.createdAt))}</span>
            </div>
          </div>
        </div>
        
        <div className="shrink-0">
          <label htmlFor="reconciliation-reason" className="block text-sm font-semibold text-slate-900 mb-1">Reason / Description</label>
          <div className="relative">
            <textarea
              id="reconciliation-reason"
              className="w-full rounded-lg border border-slate-300 p-2 pb-6 text-[13px] focus:border-taste-pink focus:outline-none focus:ring-1 focus:ring-taste-pink min-h-[60px]"
              placeholder="e.g., Routine weekly stock count, discrepancy investigation, or post-delivery verification."
              value={reason}
              onChange={(e) => setReason(e.target.value.substring(0, 250))}
            />
            <div className="absolute bottom-1.5 right-2 text-[10px] text-slate-400 font-medium">
              {reason.length}/250
            </div>
          </div>
        </div>

        <div className="shrink-0">
          <VarianceSummary items={items} />
        </div>

        <div className="overflow-y-auto flex-1 min-h-0 rounded-xl border border-taste-border bg-white shadow-sm">
          <table className="w-full min-w-[700px] text-left text-sm relative">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="px-3 py-2 font-semibold">Item</th>
                <th className="px-3 py-2 font-semibold w-16">Unit</th>
                <th className="px-3 py-2 font-semibold w-24">System Qty</th>
                <th className="px-3 py-2 font-semibold w-32">Actual Count</th>
                <th className="px-3 py-2 font-semibold w-24">Variance</th>
                <th className="px-3 py-2 font-semibold w-32">Status</th>
                <th className="px-3 py-2 font-semibold w-40">Note (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-taste-border text-[13px]">
              {items.map((item, index) => (
                <tr key={item.ingredientId} className="hover:bg-slate-50 transition-colors">
                  <td className="px-3 py-2 font-semibold text-slate-900">
                    {item.name}
                  </td>
                  <td className="px-3 py-2 text-slate-500">
                    {item.unit}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {formatQuantity(item.systemQuantity, item.unit)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <label className="sr-only" htmlFor={`count-${item.ingredientId}`}>Actual count for {item.name}</label>
                      <Input 
                        id={`count-${item.ingredientId}`} 
                        type="number" 
                        min="0" 
                        step="0.01" 
                        inputMode="decimal" 
                        value={item.physicalQuantity ?? ""} 
                        onChange={(event) => change(index, "physicalQuantity", event.target.value)} 
                        placeholder={`0`} 
                        className="w-16 h-8 text-right text-[13px]" 
                      />
                      <span className="text-slate-500 text-[11px]">{item.unit}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    {item.variance !== null ? (
                      <span className={cn("font-medium", item.variance === 0 ? "text-slate-500" : item.variance > 0 ? "text-sky-600" : "text-rose-600")}>
                        {signed(item.variance, item.unit)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <CountBadge item={item} />
                  </td>
                  <td className="px-3 py-2">
                    <Input
                      value={item.note ?? ""}
                      onChange={(event) => change(index, "note", event.target.value)}
                      placeholder="Add note..."
                      className={cn("w-full h-8 text-[12px] transition-opacity", item.variance === null || item.variance === 0 ? "opacity-50 focus:opacity-100" : "")}
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
  const isOwner = currentUser?.role === "OWNER";

  const [records, setRecords] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedBranch, setLoadedBranch] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [date, setDate] = useState("ALL");
  const [customDateStart, setCustomDateStart] = useState("");
  const [customDateEnd, setCustomDateEnd] = useState("");
  const [activeDropdown, setActiveDropdown] = useState(null);

  const [activeRecord, setActiveRecord] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [confirmSubmit, setConfirmSubmit] = useState(null);
  const [confirmAdjustment, setConfirmAdjustment] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });

  const load = async () => {
    if (!currentBranch?.id) return;
    setLoading(true);
    try {
      const [recs, inv] = await Promise.all([
        getReconciliations(currentBranch.id),
        getInventory(currentBranch.id)
      ]);
      setRecords(recs);
      setInventory(inv);
      setError("");
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoadedBranch(currentBranch.id);
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [currentBranch?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const flatItems = useMemo(() => {
    const inventoryMap = new Map(inventory.map(item => [item.id, item]));
    const latestEvents = new Map();
    const historyEvents = new Map();

    records.forEach(record => {
      record.items.forEach(item => {
        const invItem = inventoryMap.get(item.ingredientId);
        if (!invItem) return;
        
        const event = {
          ...item,
          reconciliationId: record.id,
          reconciliationStatus: record.status,
          adjustmentStatus: record.adjustmentStatus,
          reconciliationType: "Stock Count",
          date: record.createdAt,
          branch: record.branchId,
          performedBy: record.performedBy?.name || "Unknown",
          performedByRole: record.performedBy?.role === "OWNER" ? "Owner / Manager" : record.performedBy?.role === "STAFF" ? "Staff" : record.performedBy?.role || "—",
          reconciliationReason: record.reason || "",
          category: invItem.category,
          supplier: invItem.supplier,
          costPerUnit: invItem.costPerUnit,
          note: item.note || "",
          derivedStatus: getItemStatus({ ...item, reconciliationStatus: record.status })
        };

        if (!historyEvents.has(item.ingredientId)) historyEvents.set(item.ingredientId, []);
        historyEvents.get(item.ingredientId).push(event);

        if (!latestEvents.has(item.ingredientId) || new Date(record.createdAt) > new Date(latestEvents.get(item.ingredientId).date)) {
          latestEvents.set(item.ingredientId, event);
        }
      });
    });

    inventory.forEach(invItem => {
      if (!invItem.active) return;
      if (!latestEvents.has(invItem.id)) {
        const pendingEvent = {
          ingredientId: invItem.id,
          name: invItem.name,
          unit: invItem.unit,
          category: invItem.category,
          supplier: invItem.supplier,
          costPerUnit: invItem.costPerUnit,
          systemQuantity: invItem.currentQuantity,
          physicalQuantity: null,
          variance: null,
          reason: "",
          reconciliationId: null,
          reconciliationStatus: "PENDING",
          adjustmentStatus: "NOT_APPLICABLE",
          date: null,
          branch: currentBranch.id,
          performedBy: "—",
          performedByRole: "—",
          derivedStatus: "pending"
        };
        latestEvents.set(invItem.id, pendingEvent);
      }
    });

    return { latest: Array.from(latestEvents.values()), history: historyEvents };
  }, [records, inventory, currentBranch.id]);

  const summaries = useMemo(() => {
    return flatItems.latest.reduce((acc, item) => {
      acc.total += 1;
      if (item.derivedStatus === "matched") acc.matched += 1;
      else if (item.derivedStatus === "discrepancy") acc.discrepancies += 1;
      else if (item.derivedStatus === "pending") acc.pending += 1;
      return acc;
    }, { total: 0, matched: 0, discrepancies: 0, pending: 0 });
  }, [flatItems]);

  const filtered = useMemo(() => {
    return flatItems.latest.filter(item => {
      const term = search.toLowerCase().trim();
      const matchesSearch = !term || 
        item.name.toLowerCase().includes(term) || 
        (item.category && item.category.toLowerCase().includes(term)) ||
        (item.supplier && item.supplier.toLowerCase().includes(term)) ||
        (item.reconciliationId && item.reconciliationId.toLowerCase().includes(term)) ||
        (item.performedBy && item.performedBy.toLowerCase().includes(term));
      
      const matchesStatus = status === "ALL" || 
        (status === "MATCHED" && item.derivedStatus === "matched") ||
        (status === "DISCREPANCY" && item.derivedStatus === "discrepancy") ||
        (status === "PENDING" && item.derivedStatus === "pending");

      let matchesDate = true;
      if (date !== "ALL" && item.date) {
        const itemDate = new Date(item.date);
        const today = new Date();
        today.setHours(0,0,0,0);
        const diffDays = Math.floor((new Date() - itemDate) / (1000 * 60 * 60 * 24));
        
        if (date === "TODAY") matchesDate = diffDays === 0;
        else if (date === "YESTERDAY") matchesDate = diffDays === 1;
        else if (date === "THIS_WEEK") matchesDate = diffDays <= 7; 
        else if (date === "LAST_WEEK") matchesDate = diffDays > 7 && diffDays <= 14;
        else if (date === "THIS_MONTH") matchesDate = itemDate.getMonth() === new Date().getMonth() && itemDate.getFullYear() === new Date().getFullYear();
        else if (date === "LAST_MONTH") matchesDate = itemDate.getMonth() === (new Date().getMonth() - 1 + 12) % 12;
        else if (date === "CUSTOM") {
          if (customDateStart) matchesDate = matchesDate && itemDate >= new Date(customDateStart);
          if (customDateEnd) matchesDate = matchesDate && itemDate <= new Date(customDateEnd + "T23:59:59");
        }
      } else if (date !== "ALL" && !item.date) {
        matchesDate = false;
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [flatItems, search, status, date, customDateStart, customDateEnd]);

  const start = async () => {
    try {
      const record = await createReconciliation(currentBranch.id, currentUser);
      setRecords(await getReconciliations(currentBranch.id));
      setActiveRecord(record);
    } catch (startError) {
      notify(startError.message, "danger");
    }
  };

  const save = async (items, reason) => {
    const saved = await saveDraft(currentBranch.id, activeRecord.id, items, reason, currentUser);
    setRecords(await getReconciliations(currentBranch.id));
    setActiveRecord(saved);
    notify("Reconciliation draft saved.");
  };

  const submit = async () => {
    try {
      await submitReconciliation(currentBranch.id, confirmSubmit.id, confirmSubmit.items, confirmSubmit.reason, currentUser);
      setRecords(await getReconciliations(currentBranch.id));
      setActiveRecord(null);
      setConfirmSubmit(null);
      notify("Reconciliation submitted successfully.");
    } catch (submitError) {
      setConfirmSubmit(null);
      notify(submitError.message, "danger");
    }
  };

  const apply = async () => {
    try {
      await applyAdjustment(currentBranch.id, confirmAdjustment.id, currentUser);
      setRecords(await getReconciliations(currentBranch.id));
      setConfirmAdjustment(null);
      setSelectedItem(null);
      notify("Inventory quantities were adjusted from the verified counts.");
    } catch (adjustmentError) {
      setConfirmAdjustment(null);
      notify(adjustmentError.message, "danger");
    }
  };

  if (loading || loadedBranch !== currentBranch?.id) return <PageContainer><LoadingState label="Loading reconciliations" /></PageContainer>;
  if (error || !currentBranch) return <PageContainer><ErrorState title="Reconciliation unavailable" description={error || "Select a branch to continue."} /></PageContainer>;

  return (
    <PageContainer>


      <ResponsiveGrid className="mt-7" columns="four">
        <button onClick={() => setStatus("ALL")} className={cn("text-left transition-all rounded-2xl", status === "ALL" ? "ring-2 ring-taste-purple ring-offset-2" : "hover:scale-[1.02]")}>
          <StatCard label="Total Items" value={summaries.total} trend="All inventory items" icon={ClipboardCheck} className="h-full" />
        </button>
        <button onClick={() => setStatus("MATCHED")} className={cn("text-left transition-all rounded-2xl", status === "MATCHED" ? "ring-2 ring-emerald-500 ring-offset-2" : "hover:scale-[1.02]")}>
          <StatCard label="Matched" value={summaries.matched} trend="No discrepancies" icon={CheckCircle2} className="h-full border-emerald-200" />
        </button>
        <button onClick={() => setStatus("DISCREPANCY")} className={cn("text-left transition-all rounded-2xl", status === "DISCREPANCY" ? "ring-2 ring-amber-500 ring-offset-2" : "hover:scale-[1.02]")}>
          <StatCard label="Discrepancies" value={summaries.discrepancies} trend="Needs adjustment" icon={TriangleAlert} className="h-full border-amber-200" />
        </button>
        <button onClick={() => setStatus("PENDING")} className={cn("text-left transition-all rounded-2xl", status === "PENDING" ? "ring-2 ring-taste-purple ring-offset-2" : "hover:scale-[1.02]")}>
          <StatCard label="Pending" value={summaries.pending} trend="Not yet reconciled" icon={FilePenLine} className="h-full" />
        </button>
      </ResponsiveGrid>

      <FilterBar className="mt-7 flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 w-full xl:w-auto">
          <SearchInput 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            placeholder="Search ingredient, category, supplier..." 
            aria-label="Search reconciliations" 
            className="w-full sm:w-auto flex-1 min-w-[200px] max-w-[320px]" 
          />
          
          <div className="relative w-full sm:w-auto flex-1 min-w-[140px] max-w-[220px]">
            <Button variant="outline" className="w-full justify-between bg-white text-slate-700" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === "status" ? null : "status"); }}>
              <span className="truncate">
                {status === "ALL" ? "All Statuses" : status === "MATCHED" ? "Matched" : status === "DISCREPANCY" ? "Discrepancy" : "Pending"}
              </span>
              <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
            </Button>
            <Dropdown open={activeDropdown === "status"} className="left-0 w-full min-w-48 p-2">
              {[
                { value: "ALL", label: "All Statuses" },
                { value: "MATCHED", label: "Matched" },
                { value: "DISCREPANCY", label: "Discrepancy" },
                { value: "PENDING", label: "Pending" }
              ].map(opt => (
                <button key={opt.value} type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50" onClick={() => { setStatus(opt.value); setActiveDropdown(null); }}>
                  <span className={cn(status === opt.value ? "font-semibold text-taste-purple" : "text-slate-700")}>{opt.label}</span>
                  {status === opt.value && <Check size={16} className="text-taste-purple" />}
                </button>
              ))}
            </Dropdown>
          </div>

          <div className="relative w-full sm:w-auto flex-1 min-w-[140px] max-w-[220px]">
            <Button variant="outline" className="w-full justify-between bg-white text-slate-700" onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === "date" ? null : "date"); }}>
              <span className="truncate">
                {date === "ALL" ? "All Dates" : date === "TODAY" ? "Today" : date === "YESTERDAY" ? "Yesterday" : date === "THIS_WEEK" ? "This Week" : date === "LAST_WEEK" ? "Last Week" : date === "THIS_MONTH" ? "This Month" : date === "LAST_MONTH" ? "Last Month" : "Custom Range"}
              </span>
              <ChevronDown size={16} className="text-slate-400 shrink-0 ml-2" />
            </Button>
            <Dropdown open={activeDropdown === "date"} className="left-0 w-full min-w-48 p-2" onClick={(e) => e.stopPropagation()}>
              {[
                { value: "ALL", label: "All Dates" },
                { value: "TODAY", label: "Today" },
                { value: "YESTERDAY", label: "Yesterday" },
                { value: "THIS_WEEK", label: "This Week" },
                { value: "LAST_WEEK", label: "Last Week" },
                { value: "THIS_MONTH", label: "This Month" },
                { value: "LAST_MONTH", label: "Last Month" },
                { value: "CUSTOM", label: "Custom Date Range" }
              ].map(opt => (
                <button key={opt.value} type="button" className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-slate-50" onClick={() => { setDate(opt.value); if (opt.value !== "CUSTOM") setActiveDropdown(null); }}>
                  <span className={cn(date === opt.value ? "font-semibold text-taste-purple" : "text-slate-700")}>{opt.label}</span>
                  {date === opt.value && <Check size={16} className="text-taste-purple" />}
                </button>
              ))}
              {date === "CUSTOM" && (
                <div className="p-3 border-t border-slate-100 mt-2 space-y-3">
                  <div>
                    <label className="text-xs text-slate-500 font-medium">Start Date</label>
                    <Input type="date" value={customDateStart} onChange={(e) => setCustomDateStart(e.target.value)} className="w-full text-sm mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-medium">End Date</label>
                    <Input type="date" value={customDateEnd} onChange={(e) => setCustomDateEnd(e.target.value)} className="w-full text-sm mt-1" />
                  </div>
                  <Button size="sm" className="w-full" onClick={() => setActiveDropdown(null)}>Apply</Button>
                </div>
              )}
            </Dropdown>
          </div>
        </div>
        
        <Button onClick={start} className="bg-taste-purple hover:bg-taste-purple-strong text-white w-full lg:w-auto shrink-0">
          <ClipboardCheck size={16} />Start Reconciliation
        </Button>
      </FilterBar>

      <ContentCard className="mt-7 p-0 overflow-hidden">
        {filtered.length ? (
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableCell as="th">Ingredient</TableCell>
                  <TableCell as="th">Category</TableCell>
                  <TableCell as="th">System Stock</TableCell>
                  <TableCell as="th">Physical Count</TableCell>
                  <TableCell as="th">Variance</TableCell>
                  <TableCell as="th">Status</TableCell>
                  <TableCell as="th">Performed By</TableCell>
                  <TableCell as="th">Date & Time</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(item => (
                  <TableRow key={item.ingredientId} className={cn("cursor-pointer transition-colors hover:bg-slate-50", selectedItem?.ingredientId === item.ingredientId ? "bg-slate-50" : "")} onClick={() => setSelectedItem(item)}>
                    <TableCell className="font-semibold text-slate-900">{item.name}</TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>{formatQuantity(item.systemQuantity, item.unit)}</TableCell>
                    <TableCell>{item.physicalQuantity === null ? "—" : formatQuantity(item.physicalQuantity, item.unit)}</TableCell>
                    <TableCell className="font-medium text-slate-900">{item.variance === null ? "—" : signed(item.variance, item.unit)}</TableCell>
                    <TableCell><ItemStatusBadge status={item.derivedStatus} /></TableCell>
                    <TableCell>
                      {item.performedBy !== "—" ? (
                        <>
                          <span className="block text-slate-900">{item.performedBy}</span>
                          <span className="block text-xs text-slate-500">{item.performedByRole}</span>
                        </>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-slate-500">{item.date ? dateFormat.format(new Date(item.date)) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="p-8">
            <EmptyState title="No matching items" description="Try changing or clearing your filters." />
          </div>
        )}
      </ContentCard>

      {selectedItem && (
        <Drawer 
          open 
          onClose={() => setSelectedItem(null)} 
          title="Reconciliation Details"
          footer={
            <>
              <Button className="w-full bg-taste-purple hover:bg-taste-purple-strong text-white" onClick={() => setSelectedItem(null)}>Close Details</Button>
              {isOwner && selectedItem.reconciliationStatus === "COMPLETED" && selectedItem.adjustmentStatus === "PENDING" && (
                <Button variant="outline" className="w-full mt-2" onClick={() => {
                  const record = records.find(r => r.id === selectedItem.reconciliationId);
                  if (record) setConfirmAdjustment(record);
                }}>
                  Apply Inventory Adjustment
                </Button>
              )}
              {selectedItem.reconciliationStatus === "DRAFT" && (
                <Button variant="outline" className="w-full mt-2" onClick={() => {
                  const record = records.find(r => r.id === selectedItem.reconciliationId);
                  if (record) {
                    setActiveRecord(record);
                    setSelectedItem(null);
                  }
                }}>
                  Continue Draft
                </Button>
              )}
            </>
          }
        >
          <div className="space-y-8 p-1">
            
            {/* Drawer Summary */}
            <div className="flex flex-col gap-2">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-xl font-bold text-slate-900">{selectedItem.name}</h3>
                <ItemStatusBadge status={selectedItem.derivedStatus} />
              </div>
              <p className="text-sm font-medium text-slate-500">{selectedItem.category}</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-taste-border bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">System Stock</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{formatQuantity(selectedItem.systemQuantity, selectedItem.unit)}</p>
              </div>
              <div className="rounded-xl border border-taste-border bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Physical Count</p>
                <p className="mt-1 text-lg font-bold text-slate-900">{selectedItem.physicalQuantity === null ? "—" : formatQuantity(selectedItem.physicalQuantity, selectedItem.unit)}</p>
              </div>
              <div className="rounded-xl border border-taste-border bg-slate-50 p-4">
                <p className="text-xs font-medium text-slate-500">Variance</p>
                <p className={cn("mt-1 text-lg font-bold", selectedItem.variance === 0 || selectedItem.variance === null ? "text-slate-900" : selectedItem.variance > 0 ? "text-sky-600" : "text-amber-600")}>
                  {selectedItem.variance === null ? "—" : signed(selectedItem.variance, selectedItem.unit)}
                </p>
              </div>
            </div>

            {/* Reconciliation Information */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Reconciliation Information</h4>
              <div className="grid grid-cols-2 gap-y-3 rounded-xl border border-taste-border bg-slate-50 p-5 text-sm">
                <div className="text-slate-500">Reconciliation ID</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.reconciliationId || "—"}</div>
                
                <div className="text-slate-500">Type</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.reconciliationId ? "Stock Count" : "—"}</div>
                
                <div className="text-slate-500">Branch</div>
                <div className="text-right font-medium text-slate-900 capitalize">{selectedItem.branch || "—"}</div>
                
                <div className="text-slate-500">Date & Time</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.date ? dateFormat.format(new Date(selectedItem.date)) : "—"}</div>
                
                <div className="text-slate-500">Performed By</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.performedBy}</div>
                
                <div className="text-slate-500">Role</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.performedByRole}</div>
              </div>
            </div>

            {/* Item Information */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Item Information</h4>
              <div className="grid grid-cols-2 gap-y-3 rounded-xl border border-taste-border bg-slate-50 p-5 text-sm">
                <div className="text-slate-500">Unit</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.unit}</div>
                
                <div className="text-slate-500">Category</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.category}</div>
                
                <div className="text-slate-500">Supplier</div>
                <div className="text-right font-medium text-slate-900">{selectedItem.supplier || "Not specified"}</div>
                
                {selectedItem.costPerUnit !== undefined && (
                  <>
                    <div className="text-slate-500">Cost per unit</div>
                    <div className="text-right font-medium text-slate-900">₱{numberFormat.format(selectedItem.costPerUnit)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Reconciliation Notes */}
            <div>
              <h4 className="mb-3 text-sm font-semibold text-slate-900">Reconciliation Notes</h4>
              <div className="rounded-xl border border-taste-border bg-slate-50 p-5 text-sm">
                {selectedItem.reconciliationReason ? (
                  <p className="text-slate-900 whitespace-pre-wrap">{selectedItem.reconciliationReason}</p>
                ) : (
                  <p className="text-slate-500 italic">No description provided.</p>
                )}
              </div>
            </div>

            {/* Reconciliation History */}
            {flatItems.history.get(selectedItem.ingredientId) && flatItems.history.get(selectedItem.ingredientId).length > 0 && (
              <div>
                <h4 className="mb-3 text-sm font-semibold text-slate-900">Reconciliation History</h4>
                <ul className="space-y-3">
                  {flatItems.history.get(selectedItem.ingredientId).map(historyEvent => (
                    <li key={historyEvent.reconciliationId} className="rounded-xl border border-taste-border bg-slate-50 p-4 text-sm">
                      <div className="flex justify-between font-medium mb-1">
                        <span className={historyEvent.variance === 0 ? "text-emerald-600" : "text-amber-600"}>
                          {historyEvent.variance === 0 ? "Matched" : "Discrepancy"}
                        </span>
                        <span className="text-slate-900">
                          {formatQuantity(historyEvent.systemQuantity, historyEvent.unit)} vs {formatQuantity(historyEvent.physicalQuantity, historyEvent.unit)} ({signed(historyEvent.variance, historyEvent.unit)})
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-500 text-xs">
                        <span>{dateFormat.format(new Date(historyEvent.date))}</span>
                        <span>by {historyEvent.performedBy}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Drawer>
      )}

      {activeRecord && <CountModal record={activeRecord} onClose={() => setActiveRecord(null)} onSave={save} onSubmit={(items, reason) => setConfirmSubmit({ ...activeRecord, items, reason })} />}
      
      {confirmSubmit && <ConfirmDialog open onClose={() => setConfirmSubmit(null)} onConfirm={submit} title="Submit reconciliation?" description={`${confirmSubmit.items.filter((item) => Number(item.physicalQuantity) !== item.systemQuantity).length} item(s) have a variance. This saves the verified count but does not change recorded inventory until an Owner explicitly applies an adjustment.`} confirmLabel="Submit reconciliation" />}
      {confirmAdjustment && <ConfirmDialog open onClose={() => setConfirmAdjustment(null)} onConfirm={apply} title="Apply inventory adjustment?" description="This will update recorded inventory quantities to the verified physical counts for items with a variance. This action is recorded on the reconciliation." confirmLabel="Apply adjustment" />}
      
      <Toast open={toast.open} variant={toast.variant} onClose={() => setToast((current) => ({ ...current, open: false }))}>{toast.message}</Toast>
    </PageContainer>
  );
}
