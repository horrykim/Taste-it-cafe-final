import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Plus, Boxes, TriangleAlert, PackageX, CheckCircle2, ClipboardCheck, History } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, SearchInput, Toast, FilterMenu } from "../../components/ui";
import PageContainer from "../../components/layout/PageContainer";
import { adjustStock, createInventoryItem, deleteInventoryItem, getAllBranchHistory, getInventory, getInventoryCategories, getReconciliationReasons, getUnits, updateInventoryItem, updateStockThresholds } from "../../services/inventoryService";

import { InventoryItemModal } from "./components/InventoryItemModal";
import { AdjustmentModal } from "./components/AdjustmentModal";
import { ThresholdModal } from "./components/ThresholdModal";
import { InventoryList } from "./components/InventoryList";
import { InventoryDetailsDrawer } from "./components/InventoryDetailsDrawer";
import { InventoryHistoryList } from "./components/InventoryHistoryList";
import { BranchHistoryModal } from "./components/BranchHistoryModal";
import { hasMoreHistory } from "../../utils/inventoryHistory";

const sortOptions = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "stock-asc", label: "Stock (Low to High)" },
  { value: "stock-desc", label: "Stock (High to Low)" },
  { value: "updated-desc", label: "Recently Updated" }
];

function SummaryCard({ label, value, status, onClick }) {
  const config = {
    neutral: {
      bg: "bg-gradient-to-br from-white to-slate-50 border-slate-200",
      text: "text-slate-800",
      icon: "text-slate-400 bg-slate-100",
      Icon: Boxes,
    },
    success: {
      bg: "bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200",
      text: "text-emerald-800",
      icon: "text-emerald-600 bg-emerald-100",
      Icon: CheckCircle2,
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200",
      text: "text-amber-800",
      icon: "text-amber-600 bg-amber-100",
      Icon: TriangleAlert,
    },
    danger: {
      bg: "bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200",
      text: "text-rose-800",
      icon: "text-rose-600 bg-rose-100",
      Icon: PackageX,
    },
  };

  const { bg, text, icon, Icon } = config[status] ?? config.neutral;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 ${bg}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`mt-1.5 text-3xl font-extrabold tabular-nums ${text}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${icon}`}>
          <Icon size={22} />
        </div>
      </div>
    </button>
  );
}


function InventoryManagement() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const navigate = useNavigate();
  const isOwner = currentUser?.role === "OWNER";
  const [searchParams] = useSearchParams();
  const stockView = searchParams.get("status");

  const [items, setItems] = useState([]);
  const [branchHistory, setBranchHistory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [reconciliationReasons, setReconciliationReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadedBranchId, setLoadedBranchId] = useState(null);
  const [error, setError] = useState("");
  const [historyError, setHistoryError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState(stockView || "ALL");
  const [sort, setSort] = useState("name-asc");

  const [selected, setSelected] = useState(null);
  const [selectedForReconciliation, setSelectedForReconciliation] = useState([]);

  const [editItem, setEditItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [thresholdItem, setThresholdItem] = useState(null);
  const [deactivateItem, setDeactivateItem] = useState(null);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });
  const [currentPage, setCurrentPage] = useState(1);
  const [historyReloadToken, setHistoryReloadToken] = useState(0);
  const itemsPerPage = 10;
  const recentHistoryLimit = 5;

  useEffect(() => {
    let active = true;
    const branchId = currentBranch?.id;
    if (!branchId) return;

    Promise.all([
      getInventory(branchId),
      getAllBranchHistory(branchId),
      getInventoryCategories(branchId),
      getUnits(),
      getReconciliationReasons()
    ])
      .then(([inventory, historyData, inventoryCategories, unitsData, reasonsData]) => {
        if (!active) return;
        setItems(inventory);
        setBranchHistory(historyData);
        setSelectedForReconciliation([]);
        setCategories(inventoryCategories);
        setUnits(unitsData);
        setReconciliationReasons(reasonsData);
        setError("");
        setHistoryError("");
        setLoadedBranchId(branchId);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message);
          setHistoryError(loadError.message);
          setLoadedBranchId(branchId);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
          setHistoryLoading(false);
        }
      });
    return () => { active = false; };
  }, [currentBranch?.id, historyReloadToken]);

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const retryHistory = () => {
    setHistoryLoading(true);
    setHistoryReloadToken((value) => value + 1);
  };

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const term = search.trim().toLowerCase();
      const isAlert = item.status === "low-stock" || item.status === "out-of-stock";
      const matchSearch = !term || `${item.name} ${item.category} ${item.description ?? ""}`.toLowerCase().includes(term);
      const matchCategory = category === "ALL" || item.category === category;
      
      const matchStatus = status === "inactive"
        ? !item.active
        : item.active && (status === "ALL" || (status === "alerts" ? isAlert : item.status === status));

      return matchSearch && matchCategory && matchStatus;
    });

    result.sort((a, b) => {
      switch (sort) {
        case "name-asc": return a.name.localeCompare(b.name);
        case "name-desc": return b.name.localeCompare(a.name);
        case "stock-asc": return a.currentQuantity - b.currentQuantity;
        case "stock-desc": return b.currentQuantity - a.currentQuantity;
        case "updated-desc": return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
        default: return 0;
      }
    });

    return result;
  }, [items, search, category, status, sort]);

  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const inventoryMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items]);

  const summaries = useMemo(() => ({
    total: items.filter((item) => item.active).length,
    normal: items.filter((item) => item.active && item.status === "normal").length,
    low: items.filter((item) => item.active && item.status === "low-stock").length,
    out: items.filter((item) => item.active && item.status === "out-of-stock").length
  }), [items]);

  const launchReconciliation = (itemIds) => {
    const ids = [...new Set(itemIds.filter(Boolean))];
    if (!ids.length) return;
    navigate(`/app/reconciliation?mode=targeted&items=${encodeURIComponent(ids.join(","))}`);
  };

  const toggleReconciliationSelection = (itemId) => {
    setSelectedForReconciliation((current) =>
      current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
    );
  };

  const toggleVisibleSelection = (visibleItems) => {
    const visibleIds = visibleItems.map((item) => item.id);
    const allVisibleSelected = visibleIds.every((id) => selectedForReconciliation.includes(id));

    setSelectedForReconciliation((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !visibleIds.includes(id));
      }

      return [...new Set([...current, ...visibleIds])];
    });
  };

  const mutate = async (action, successMsg) => {
    try {
      await action();
      const [newItems, newHistory] = await Promise.all([
        getInventory(currentBranch.id),
        getAllBranchHistory(currentBranch.id),
      ]);
      setItems(newItems);
      setBranchHistory(newHistory);
      setHistoryError("");
      if (selected) {
        const updatedSelected = newItems.find(i => i.id === selected.id);
        if (updatedSelected) setSelected(updatedSelected);
      }
      notify(successMsg);
    } catch (mutationError) {
      notify(mutationError.message, "danger");
    }
  };

  const hasFilters = Boolean(search || category !== "ALL" || status !== "ALL");
  const recentBranchHistory = branchHistory.slice(0, recentHistoryLimit);
  const categoryOptions = [
    { value: "ALL", label: "All categories" },
    ...categories.map(c => ({ value: c, label: c }))
  ];

  if (loading || loadedBranchId !== currentBranch?.id) {
    return (
      <PageContainer>
        <LoadingState label="Loading inventory" />
      </PageContainer>
    );
  }

  if (error || !currentBranch) {
    return (
      <PageContainer>
        <ErrorState title="Inventory unavailable" description={error || "Select a branch to view inventory."} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-taste-heading">Inventory</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {summaries.total} items tracked &nbsp;·&nbsp;
            <span className="text-amber-600 font-semibold">{summaries.low} low</span>
            {summaries.out > 0 && <span className="text-rose-600 font-semibold"> · {summaries.out} out of stock</span>}
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setEditItem({})} className="bg-taste-purple hover:bg-taste-purple-strong text-white whitespace-nowrap self-start sm:self-auto gap-1.5 shadow-sm">
            <Plus size={16} /> Add Item
          </Button>
        )}
      </div>

      {/* SUMMARY SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Items" value={summaries.total} status="neutral" onClick={() => { setStatus("ALL"); setCurrentPage(1); }} />
        <SummaryCard label="Normal Stock" value={summaries.normal} status="success" onClick={() => { setStatus("normal"); setCurrentPage(1); }} />
        <SummaryCard label="Low Stock" value={summaries.low} status="warning" onClick={() => { setStatus("low-stock"); setCurrentPage(1); }} />
        <SummaryCard label="Out of Stock" value={summaries.out} status="danger" onClick={() => { setStatus("out-of-stock"); setCurrentPage(1); }} />
      </div>

      {/* SEARCH + FILTER TOOLBAR */}
      <div className="flex flex-col md:flex-row gap-3 mb-4 rounded-2xl bg-white p-3 shadow-sm border border-slate-200">
        <div className="flex-1 min-w-[240px]">
          <SearchInput
            value={search}
            onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }}
            placeholder="Search inventory..."
            aria-label="Search inventory"
            className="w-full border-none shadow-none bg-slate-50"
          />
        </div>
        <div className="h-px w-full md:h-10 md:w-px bg-slate-100 hidden md:block"></div>
        <div className="flex flex-wrap items-center gap-2">
          <FilterMenu
            label="Category"
            value={category}
            options={categoryOptions}
            onChange={(val) => { setCategory(val); setCurrentPage(1); }}
          />
          <FilterMenu 
            label="Status"
            value={status}
            options={[
              { value: "ALL", label: "All active" },
              { value: "normal", label: "Normal stock" },
              { value: "low-stock", label: "Low stock" },
              { value: "out-of-stock", label: "Out of stock" },
              { value: "inactive", label: "Deactivated" }
            ]}
            onChange={(v) => { setStatus(v); setCurrentPage(1); }}
          />
          <FilterMenu
            label="Sort"
            value={sort}
            options={sortOptions}
            onChange={setSort}
          />
        </div>
      </div>

      {selectedForReconciliation.length > 0 && (
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-taste-purple/20 bg-taste-purple-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-900">
              {selectedForReconciliation.length} item(s) selected for targeted reconciliation
            </p>
            <p className="text-sm text-slate-500">
              Start a reconciliation session for just these items.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => setSelectedForReconciliation([])}>
              Clear selection
            </Button>
            <Button className="bg-taste-purple hover:bg-taste-purple-strong text-white" onClick={() => launchReconciliation(selectedForReconciliation)}>
              <ClipboardCheck size={16} />
              Reconcile Selected
            </Button>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0">
          {filteredItems.length ? (
            <>
              <InventoryList
                items={paginatedItems}
                selected={selected}
                setSelected={setSelected}
                selectedIds={selectedForReconciliation}
                onToggleSelect={toggleReconciliationSelection}
                onToggleSelectAll={toggleVisibleSelection}
                onQuickReconcile={(itemId) => launchReconciliation([itemId])}
              />
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 pt-4 gap-4">
                <p className="text-sm font-medium text-slate-500">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredItems.length)} of {filteredItems.length} items
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-slate-200 text-slate-700"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white border-slate-200 text-slate-700"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-8">
              <EmptyState
                title={hasFilters ? "No matching inventory items" : "No inventory items"}
                description={hasFilters ? "Try changing or clearing your filters." : "Add the first ingredient to this branch inventory."}
                action={isOwner && !hasFilters ? (
                  <Button onClick={() => setEditItem({})} className="bg-taste-purple hover:bg-taste-purple-strong text-white">
                    <Plus size={16} /> Add Item
                  </Button>
                ) : null}
              />
            </div>
          )}
        </div>

        <aside className="min-w-0 xl:sticky xl:top-24 xl:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Inventory History</h2>
                <p className="mt-1 text-sm text-slate-500">Recent branch activity for {currentBranch.name}</p>
              </div>
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                <History size={18} />
              </span>
            </div>
            <div className="max-h-[calc(100vh-14rem)] overflow-y-auto p-4">
              <InventoryHistoryList
                entries={recentBranchHistory}
                inventoryMap={inventoryMap}
                showItemName
                compact
                loading={historyLoading}
                error={historyError}
                emptyTitle="No recent activity recorded"
                emptyDescription="There are no recorded inventory movements for this branch yet."
                loadingLabel="Loading branch history"
                onRetry={retryHistory}
                footerAction={hasMoreHistory(branchHistory, recentHistoryLimit) ? (
                  <Button variant="outline" className="w-full" onClick={() => setShowFullHistory(true)}>
                    View Full History
                  </Button>
                ) : null}
              />
            </div>
          </div>
        </aside>
      </div>

      {/* ROW-BASED DETAILS DRAWER */}
      <InventoryDetailsDrawer
        selected={selected}
        branchId={currentBranch?.id}
        onClose={() => setSelected(null)}
        isOwner={isOwner}
        setAdjustItem={setAdjustItem}
        onReconcileItem={(item) => launchReconciliation([item.id])}
        setEditItem={setEditItem}
        setThresholdItem={setThresholdItem}
        setDeactivateItem={setDeactivateItem}
      />

      {editItem && (
        <InventoryItemModal
          item={editItem.id ? editItem : null}
          categories={categories}
          units={units}
          onClose={() => setEditItem(null)}
          onSave={(form) => {
            mutate(
              () => editItem.id
                ? updateInventoryItem(currentBranch.id, editItem.id, form, { actorRole: currentUser.role })
                : createInventoryItem(currentBranch.id, form, { actorRole: currentUser.role }),
              editItem.id ? "Inventory item updated." : "Inventory item added."
            );
            setEditItem(null);
          }}
        />
      )}
      
      {adjustItem && (
        <AdjustmentModal
          item={adjustItem}
          reconciliationReasons={reconciliationReasons}
          onClose={() => setAdjustItem(null)}
          onSave={(adjustment) => {
            mutate(
              () => adjustStock(currentBranch.id, adjustItem.id, adjustment, { user: currentUser }),
              "Stock updated."
            );
            setAdjustItem(null);
          }}
        />
      )}
      
      {thresholdItem && (
        <ThresholdModal
          item={thresholdItem}
          onClose={() => setThresholdItem(null)}
          onSave={(thresholds) => {
            mutate(
              () => updateStockThresholds(currentBranch.id, thresholdItem.id, thresholds, { actorRole: currentUser.role }),
              "Stock thresholds updated."
            );
            setThresholdItem(null);
          }}
        />
      )}
      
      {showFullHistory && (
        <BranchHistoryModal
          branchName={currentBranch?.name}
          entries={branchHistory}
          inventoryMap={inventoryMap}
          loading={historyLoading}
          error={historyError}
          onRetry={retryHistory}
          onClose={() => setShowFullHistory(false)}
        />
      )}
      
      <ConfirmDialog
        open={Boolean(deactivateItem)}
        onClose={() => setDeactivateItem(null)}
        title="Deactivate inventory item?"
        description={`Deactivate ${deactivateItem?.name ?? "this item"}? It will no longer appear in this branch's active inventory.`}
        confirmLabel="Deactivate"
        danger
        onConfirm={() => {
          mutate(
            () => deleteInventoryItem(currentBranch.id, deactivateItem.id, { actorRole: currentUser.role }),
            "Inventory item deactivated."
          );
          setDeactivateItem(null);
          if (selected?.id === deactivateItem.id) setSelected(null);
        }}
      />
      
      <Toast open={toast.open} onClose={() => setToast((current) => ({ ...current, open: false }))} variant={toast.variant}>
        {toast.message}
      </Toast>
    </PageContainer>
  );
}

export default InventoryManagement;
