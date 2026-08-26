import { useEffect, useState } from "react";
import { Button, Drawer, StatusBadge } from "../../../components/ui";
import { useBranch } from "../../../context/BranchContext";
import { getInventoryHistory } from "../../../services/mock/mockInventoryService";
import { Clock, History, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);
const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function ActivityItem({ entry }) {
  const isAdd = entry.change.startsWith("+");
  const isRemove = entry.change.startsWith("-");
  const Icon = isAdd ? TrendingUp : isRemove ? TrendingDown : Clock;
  
  return (
    <div className="flex gap-4">
      <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
        isAdd ? "bg-emerald-50 text-emerald-600" :
        isRemove ? "bg-rose-50 text-rose-600" :
        "bg-slate-100 text-slate-500"
      }`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-slate-900">{entry.type}</p>
          <span className={`text-sm font-bold ${
            isAdd ? "text-emerald-600" :
            isRemove ? "text-rose-600" :
            "text-slate-900"
          }`}>
            {entry.change}
          </span>
        </div>
        <p className="text-xs text-slate-500">{entry.reason}</p>
        <p className="text-xs font-medium text-slate-400">
          {entry.user?.name || entry.user} • {dateFormat.format(new Date(entry.timestamp))}
        </p>
      </div>
    </div>
  );
}

export function InventoryDetailsDrawer({
  selected,
  onClose,
  isOwner,
  setAdjustItem,
  setEditItem,
  setThresholdItem,
  setHistoryItem,
}) {
  const { currentBranch } = useBranch();
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => {
    if (!selected || !currentBranch) return;
    
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingActivity(true);
    
    getInventoryHistory(currentBranch.id, selected.id).then(data => {
      if (active) {
        setRecentActivity(data.slice(0, 3)); // Only show top 3 most recent
        setLoadingActivity(false);
      }
    }).catch(() => {
      if (active) setLoadingActivity(false);
    });

    return () => { active = false; };
  }, [selected, currentBranch]);

  if (!selected) return null;

  return (
    <Drawer
      open={!!selected}
      onClose={onClose}
      title="Ingredient Details"
      footer={
        <div className="space-y-3 w-full">
          <Button
            className="w-full bg-taste-purple hover:bg-taste-purple-strong text-white py-6 shadow-sm"
            onClick={() => setAdjustItem(selected)}
          >
            Adjust Stock
          </Button>
          {isOwner && (
            <div className="grid grid-cols-3 gap-2">
              <Button variant="outline" className="w-full bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => setEditItem(selected)}>
                Edit
              </Button>
              <Button variant="outline" className="w-full bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => setThresholdItem(selected)}>
                Thresholds
              </Button>
              <Button variant="outline" className="w-full bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100" onClick={() => setHistoryItem(selected)}>
                History
              </Button>
            </div>
          )}
        </div>
      }
    >
      <div className="space-y-8 pb-8">
        
        {/* HEADER AREA */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-2xl font-extrabold text-taste-heading">{selected.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600">
                  {selected.category}
                </span>
                {selected.supplier && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-sm font-medium text-slate-500">{selected.supplier}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* STOCK SUMMARY (FLATTENED) */}
        <div>
          <h4 className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Current Status</h4>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Quantity</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-slate-900">{formatNumber(selected.currentQuantity)}</span>
                <span className="text-lg font-semibold text-slate-500">{selected.unit}</span>
              </div>
            </div>
            <div className="h-12 w-px bg-slate-200"></div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-2">Status</p>
              <StatusBadge status={selected.status} />
            </div>
          </div>
        </div>

        {/* THRESHOLDS (FLATTENED) */}
        <div>
          <h4 className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Stock Thresholds</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Minimum (Low)</p>
              <p className="text-xl font-bold text-slate-800">{formatNumber(selected.lowStockThreshold)} <span className="text-sm font-medium text-slate-500">{selected.unit}</span></p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">Maximum (Target)</p>
              <p className="text-xl font-bold text-slate-800">{formatNumber(selected.targetStockLevel)} <span className="text-sm font-medium text-slate-500">{selected.unit}</span></p>
            </div>
          </div>
          {selected.status === "low-stock" && (
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 border border-amber-200">
              <AlertCircle size={16} className="text-amber-500 shrink-0" />
              <p>This item is currently below its minimum threshold and should be restocked.</p>
            </div>
          )}
        </div>
        
        {/* ITEM INFORMATION */}
        <div>
          <h4 className="mb-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Details</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">Unit Measure</span>
              <span className="font-semibold text-slate-900">{selected.unit}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">Cost per unit</span>
              <span className="font-semibold text-slate-900">
                {selected.costPerUnit !== undefined ? `₱${formatNumber(selected.costPerUnit)}` : "Not set"}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-3">
              <span className="text-slate-500 font-medium">Last Updated</span>
              <span className="font-semibold text-slate-900">
                {dateFormat.format(new Date(selected.lastUpdated))}
              </span>
            </div>
          </div>
        </div>
        
        {/* RECENT ACTIVITY */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Recent Activity</h4>
            <Button variant="ghost" size="sm" className="h-auto p-0 text-taste-purple font-semibold hover:bg-transparent" onClick={() => setHistoryItem(selected)}>
              View all
            </Button>
          </div>
          
          {loadingActivity ? (
            <div className="py-4 text-center text-sm text-slate-400">Loading activity...</div>
          ) : recentActivity.length > 0 ? (
            <div className="space-y-5">
              {recentActivity.map(entry => (
                <ActivityItem key={entry.id} entry={entry} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center">
              <History className="mx-auto mb-2 text-slate-300" size={24} />
              <p className="text-sm font-medium text-slate-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
