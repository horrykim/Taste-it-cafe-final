import { useEffect, useMemo, useState } from "react";
import { Button, Drawer, StatusBadge } from "../../../components/ui";
import { AlertCircle, History, SlidersHorizontal, Zap } from "lucide-react";
import { getInventoryHistory } from "../../../services/inventoryService";
import { hasMoreHistory } from "../../../utils/inventoryHistory";
import { InventoryHistoryList } from "./InventoryHistoryList";
import { ItemHistoryModal } from "./ItemHistoryModal";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);
const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

const STATUS_GRADIENT = {
  normal: "from-emerald-50 to-teal-50 border-emerald-200",
  "low-stock": "from-amber-50 to-orange-50 border-amber-200",
  "out-of-stock": "from-rose-50 to-pink-50 border-rose-200",
};

function StockGauge({ current, threshold, status }) {
  const max = Math.max(threshold * 3, current, 1);
  const pct = Math.min((current / max) * 100, 100);
  const barColor =
    status === "out-of-stock" ? "bg-rose-400" :
    status === "low-stock" ? "bg-amber-400" :
    "bg-emerald-400";

  return (
    <div className="mt-3">
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/60">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-1.5 flex justify-between text-xs opacity-60">
        <span>0</span>
        <span>Threshold: {formatNumber(threshold)}</span>
      </div>
    </div>
  );
}

export function InventoryDetailsDrawer({
  selected,
  branchId,
  onClose,
  isOwner,
  setAdjustItem,
  onReconcileItem,
  setEditItem,
  setThresholdItem,
  setDeactivateItem,
}) {
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [showFullHistory, setShowFullHistory] = useState(false);
  const recentHistoryLimit = 5;

  useEffect(() => {
    let active = true;

    if (selected?.id && branchId) {
      (async () => {
        setHistoryLoading(true);
        setHistoryError("");

        try {
          const entries = await getInventoryHistory(branchId, selected.id);
          if (!active) return;
          setHistoryEntries(entries);
        } catch (error) {
          if (!active) return;
          setHistoryError(error.message);
          setHistoryEntries([]);
        } finally {
          if (active) {
            setHistoryLoading(false);
          }
        }
      })();
    }

    return () => { active = false; };
  }, [branchId, selected?.id]);

  const recentHistory = useMemo(
    () => historyEntries.slice(0, recentHistoryLimit),
    [historyEntries]
  );

  const retryHistory = () => {
    if (!selected?.id || !branchId) return;
    setHistoryLoading(true);
    setHistoryError("");
    getInventoryHistory(branchId, selected.id)
      .then((entries) => setHistoryEntries(entries))
      .catch((error) => {
        setHistoryError(error.message);
        setHistoryEntries([]);
      })
      .finally(() => setHistoryLoading(false));
  };

  if (!selected) return null;

  const gradientClass = STATUS_GRADIENT[selected.status] ?? "from-slate-50 to-white border-slate-200";

  return (
    <Drawer
      open={!!selected}
      onClose={onClose}
      title="Item Details"
      footer={
        <div className="w-full space-y-3">
          <Button
            className="w-full gap-2 border border-taste-purple/20 bg-white py-6 text-taste-purple shadow-sm hover:bg-taste-purple-soft"
            onClick={() => onReconcileItem?.(selected)}
          >
            <History size={16} /> Reconcile This Item
          </Button>
          <Button
            className="w-full gap-2 bg-taste-purple py-6 text-white shadow-sm hover:bg-taste-purple-strong"
            onClick={() => setAdjustItem(selected)}
          >
            <Zap size={16} /> Adjust Stock
          </Button>
          {isOwner && (
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="w-full gap-1 bg-slate-50 text-xs text-slate-700 hover:bg-slate-100" onClick={() => setEditItem(selected)}>
                Edit
              </Button>
              <Button variant="outline" className="w-full gap-1 bg-slate-50 text-xs text-slate-700 hover:bg-slate-100" onClick={() => setThresholdItem(selected)}>
                <SlidersHorizontal size={12} /> Threshold
              </Button>
              <Button variant="outline" className="w-full gap-1 bg-slate-50 text-xs text-slate-700 hover:bg-slate-100" onClick={() => onClose?.()}>
                Close
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-6 pb-8">
        <div className={`rounded-2xl border bg-gradient-to-br p-5 ${gradientClass}`}>
          <div className="mb-1 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-2xl font-extrabold leading-tight text-slate-900">{selected.name}</h3>
              <span className="mt-2 inline-flex items-center rounded-full border border-white/40 bg-white/60 px-2.5 py-0.5 text-xs font-semibold text-slate-600 backdrop-blur-sm">
                {selected.category}
              </span>
            </div>
            <StatusBadge status={selected.status} />
          </div>

          <div className="mt-4">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-500">Current Quantity</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-5xl font-black leading-none tabular-nums text-slate-900">
                {formatNumber(selected.currentQuantity)}
              </span>
              <span className="text-xl font-bold text-slate-500">{selected.unit}</span>
            </div>
            <StockGauge
              current={selected.currentQuantity}
              threshold={selected.lowStockThreshold}
              status={selected.status}
            />
          </div>
        </div>

        {selected.status === "low-stock" && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle size={16} className="shrink-0 text-amber-500" />
            <p>Below minimum threshold - consider restocking soon.</p>
          </div>
        )}
        {selected.status === "out-of-stock" && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <AlertCircle size={16} className="shrink-0 text-rose-500" />
            <p>This item is completely out of stock.</p>
          </div>
        )}

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Stock Threshold</h4>
          <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <div>
              <p className="mb-0.5 text-xs font-semibold text-slate-500">Low-stock alert at</p>
              <p className="text-lg font-bold text-slate-800">
                {formatNumber(selected.lowStockThreshold)}
                <span className="ml-1 text-sm font-medium text-slate-500">{selected.unit}</span>
              </p>
            </div>
            {isOwner && (
              <button
                type="button"
                onClick={() => setThresholdItem(selected)}
                className="text-xs font-semibold text-taste-purple transition-colors hover:text-taste-purple-strong"
              >
                Edit
              </button>
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Details</h4>
          <div className="overflow-hidden divide-y divide-slate-100 rounded-xl border border-slate-100">
            <div className="flex items-center justify-between bg-white px-4 py-3 text-sm">
              <span className="font-medium text-slate-500">Unit Measure</span>
              <span className="font-semibold text-slate-900">{selected.unit}</span>
            </div>
            {selected.description && (
              <div className="bg-white px-4 py-3 text-sm">
                <span className="mb-1 block font-medium text-slate-500">Description</span>
                <span className="leading-relaxed text-slate-700">{selected.description}</span>
              </div>
            )}
            <div className="flex items-center justify-between bg-white px-4 py-3 text-sm">
              <span className="font-medium text-slate-500">Last Updated</span>
              <span className="font-semibold text-slate-900">{dateFormat.format(new Date(selected.lastUpdated))}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Recent Activity</h4>
              <p className="mt-1 text-sm text-slate-500">Latest movements for this item.</p>
            </div>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
              <History size={16} />
            </span>
          </div>

          <InventoryHistoryList
            entries={recentHistory}
            compact
            loading={historyLoading}
            error={historyError}
            emptyTitle="No recent activity recorded"
            emptyDescription="There are no recorded inventory movements for this item yet."
            loadingLabel="Loading item history"
            onRetry={retryHistory}
            footerAction={hasMoreHistory(historyEntries, recentHistoryLimit) ? (
              <Button variant="outline" className="w-full" onClick={() => setShowFullHistory(true)}>
                View Full History
              </Button>
            ) : null}
          />
        </div>

        {isOwner && (
          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <button
              type="button"
              onClick={() => setDeactivateItem(selected)}
              className="text-xs font-semibold text-rose-500 transition-colors hover:text-rose-600"
            >
              Deactivate Item
            </button>
          </div>
        )}
      </div>

      {showFullHistory ? (
        <ItemHistoryModal
          itemName={selected.name}
          entries={historyEntries}
          loading={historyLoading}
          error={historyError}
          onRetry={retryHistory}
          onClose={() => setShowFullHistory(false)}
        />
      ) : null}
    </Drawer>
  );
}
