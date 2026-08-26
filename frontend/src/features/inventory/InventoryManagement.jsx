import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Plus, Boxes, TriangleAlert, PackageX, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, SearchInput, Toast, FilterMenu } from "../../components/ui";
import PageContainer from "../../components/layout/PageContainer";
import { adjustStock, createInventoryItem, deleteInventoryItem, getInventory, getInventoryCategories, updateInventoryItem, updateStockThresholds } from "../../services/mock/mockInventoryService";
import { getMockMenuData } from "../../services/mock/mockMenuService";

import { InventoryItemModal } from "./components/InventoryItemModal";
import { AdjustmentModal } from "./components/AdjustmentModal";
import { ThresholdModal } from "./components/ThresholdModal";
import { ItemHistoryModal } from "./components/ItemHistoryModal";
import { InventoryList } from "./components/InventoryList";
import { InventoryDetailsDrawer } from "./components/InventoryDetailsDrawer";

const statusOptions = [
  { value: "ALL", label: "All statuses" },
  { value: "normal", label: "Normal" },
  { value: "low-stock", label: "Low Stock" },
  { value: "out-of-stock", label: "Out of Stock" }
];

const sortOptions = [
  { value: "name-asc", label: "Name (A-Z)" },
  { value: "name-desc", label: "Name (Z-A)" },
  { value: "stock-asc", label: "Stock (Low to High)" },
  { value: "stock-desc", label: "Stock (High to Low)" },
  { value: "updated-desc", label: "Recently Updated" }
];

function SummaryCard({ label, value, status }) {
  const isDanger = status === "danger";
  const isWarning = status === "warning";
  const isSuccess = status === "success";

  let bgClass = "bg-white border-slate-200";
  let textClass = "text-slate-900";
  let iconClass = "text-slate-400";
  let Icon = Boxes;

  if (isDanger) {
    bgClass = "bg-rose-50 border-rose-200";
    textClass = "text-rose-900";
    iconClass = "text-rose-500";
    Icon = PackageX;
  } else if (isWarning) {
    bgClass = "bg-amber-50 border-amber-200";
    textClass = "text-amber-900";
    iconClass = "text-amber-500";
    Icon = TriangleAlert;
  } else if (isSuccess) {
    bgClass = "bg-emerald-50 border-emerald-200";
    textClass = "text-emerald-900";
    iconClass = "text-emerald-500";
    Icon = CheckCircle2;
  }

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${bgClass}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`mt-1 text-3xl font-bold ${textClass}`}>{value}</p>
        </div>
        <div className={`rounded-xl p-2.5 bg-white/60 ${iconClass}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
}

function InventoryManagement() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const isOwner = currentUser?.role === "OWNER";
  const [searchParams] = useSearchParams();
  const stockView = searchParams.get("status");

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedBranchId, setLoadedBranchId] = useState(null);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [status, setStatus] = useState(stockView || "ALL");
  const [sort, setSort] = useState("name-asc");

  const [selected, setSelected] = useState(null);

  const [editItem, setEditItem] = useState(null);
  const [adjustItem, setAdjustItem] = useState(null);
  const [thresholdItem, setThresholdItem] = useState(null);
  const [deactivateItem, setDeactivateItem] = useState(null);
  const [historyItem, setHistoryItem] = useState(null);

  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    let active = true;
    const branchId = currentBranch?.id;
    if (!branchId) return;

    Promise.all([
      getInventory(branchId),
      getInventoryCategories(branchId),
      getMockMenuData(branchId)
    ])
      .then(([inventory, inventoryCategories, menu]) => {
        if (!active) return;
        setItems(inventory);
        setCategories(inventoryCategories);
        setMenuItems(menu.items);
        setError("");
        setLoadedBranchId(branchId);
      })
      .catch((loadError) => {
        if (active) {
          setError(loadError.message);
          setLoadedBranchId(branchId);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [currentBranch?.id]);

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      const term = search.trim().toLowerCase();
      const isAlert = item.status === "low-stock" || item.status === "out-of-stock";
      const matchSearch = !term || `${item.name} ${item.category} ${item.supplier ?? ""}`.toLowerCase().includes(term);
      const matchCategory = category === "ALL" || item.category === category;
      const matchStatus = status === "ALL" || (status === "alerts" ? isAlert : item.status === status);
      return item.active && matchSearch && matchCategory && matchStatus;
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

  const summaries = useMemo(() => ({
    total: items.filter((item) => item.active).length,
    normal: items.filter((item) => item.active && item.status === "normal").length,
    low: items.filter((item) => item.active && item.status === "low-stock").length,
    out: items.filter((item) => item.active && item.status === "out-of-stock").length
  }), [items]);

  const usage = (item) => {
    return menuItems.flatMap((menuItem) =>
      (menuItem.recipe ?? [])
        .filter((entry) => entry.ingredientId === item.id)
        .map((entry) => ({ name: menuItem.name, quantity: entry.quantity, unit: entry.unit }))
    );
  };

  const mutate = async (action, successMsg) => {
    try {
      await action();
      const newItems = await getInventory(currentBranch.id);
      setItems(newItems);
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
          <p className="mt-1 text-sm font-medium text-slate-500">Monitor and manage branch inventory and stock levels.</p>
        </div>
        {isOwner && (
          <Button onClick={() => setEditItem({})} className="bg-taste-purple hover:bg-taste-purple-strong text-white whitespace-nowrap self-start sm:self-auto">
            <Plus size={16} /> Add Item
          </Button>
        )}
      </div>

      {/* SUMMARY SECTION */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <SummaryCard label="Total Items" value={summaries.total} status="neutral" />
        <SummaryCard label="Normal Stock" value={summaries.normal} status="success" />
        <SummaryCard label="Low Stock" value={summaries.low} status="warning" />
        <SummaryCard label="Out of Stock" value={summaries.out} status="danger" />
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
            options={statusOptions}
            onChange={(val) => { setStatus(val); setCurrentPage(1); }}
          />
          <FilterMenu
            label="Sort"
            value={sort}
            options={sortOptions}
            onChange={setSort}
          />
        </div>
      </div>

      {/* INVENTORY TABLE */}
      {filteredItems.length ? (
        <>
          <InventoryList
            items={paginatedItems}
            selected={selected}
            setSelected={setSelected}
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

      {/* ROW-BASED DETAILS DRAWER */}
      <InventoryDetailsDrawer
        selected={selected}
        onClose={() => setSelected(null)}
        isOwner={isOwner}
        setAdjustItem={setAdjustItem}
        setEditItem={setEditItem}
        setThresholdItem={setThresholdItem}
        setHistoryItem={setHistoryItem}
        usage={usage}
      />

      {editItem && (
        <InventoryItemModal
          item={editItem.id ? editItem : null}
          categories={categories}
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
          onClose={() => setAdjustItem(null)}
          onSave={(adjustment) => {
            mutate(
              () => adjustStock(currentBranch.id, adjustItem.id, adjustment, { actorRole: currentUser.role }),
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
      
      {historyItem && <ItemHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />}
      
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
        }}
      />
      
      <Toast open={toast.open} onClose={() => setToast((current) => ({ ...current, open: false }))} variant={toast.variant}>
        {toast.message}
      </Toast>
    </PageContainer>
  );
}

export default InventoryManagement;
