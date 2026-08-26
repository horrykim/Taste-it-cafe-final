import { ArrowRight, Box, Calendar, ClipboardCheck, ClipboardList, PackageSearch, Store, TriangleAlert, User } from "lucide-react";
import { useBranch } from "../../context/BranchContext";
import { Badge, Button, Drawer } from "../../components/ui";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function StatRow({ label, value, valueClass = "text-slate-900" }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium ${valueClass}`}>{value}</span>
    </div>
  );
}

export default function HistoryDetailsDrawer({ record, inventoryMap, onClose, onNavigateToReconciliation }) {
  const { currentBranch } = useBranch();
  if (!record) return null;

  const item = inventoryMap.get(record.itemId) || { name: record.itemId, category: "Unknown" };
  
  // Render badge
  let badgeProps = { label: record.type, variant: "neutral", icon: Box };
  if (record.type === "Reconciliation") {
    badgeProps = { label: "Reconciliation", variant: "purple", icon: ClipboardCheck };
  } else if (record.type === "Stock Adjustment") {
    badgeProps = { label: "Stock Adjustment", variant: "warning", icon: TriangleAlert };
  } else if (record.type === "Restock") {
    badgeProps = { label: "Restock", variant: "blue", icon: PackageSearch };
  }

  // Parse change string
  const isPositive = record.variance > 0;
  const isNegative = record.variance < 0;
  
  let changeColor = "text-slate-700";
  if (isPositive) {
    changeColor = "text-emerald-700";
  } else if (isNegative) {
    changeColor = "text-rose-700";
  }

  return (
    <Drawer open={!!record} onClose={onClose} title="History Details">
      <div className="flex flex-col gap-6">
        
        {/* Header Block */}
        <div>
          <Badge variant={badgeProps.variant} className="mb-3">
            <badgeProps.icon size={12} className="mr-1" />
            {badgeProps.label}
          </Badge>
          <h3 className="text-2xl font-semibold text-slate-900 mb-1">{item.name}</h3>
          <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">{item.category}</p>
        </div>

        {/* Dynamic Details block */}
        <div className="rounded-xl border border-taste-border bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-taste-border flex justify-between items-center">
            <h4 className="font-semibold text-slate-900 text-sm">Stock Change</h4>
            {record.reference && record.type === "Reconciliation" && (
              <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200">
                {record.reference}
              </span>
            )}
          </div>
          <div className="p-4 space-y-1 text-sm">
            {record.type === "Reconciliation" ? (
              <>
                <StatRow label="System Quantity" value={record.change.split('→')[0].trim()} />
                <StatRow label="Physical Count" value={record.change.split('→')[1]?.trim() || "N/A"} />
                <StatRow label="Variance" value={`${record.variance > 0 ? "+" : ""}${record.variance}`} valueClass={changeColor} />
                <StatRow label="Status" value={record.variance === 0 ? "Matched" : record.variance > 0 ? "Excess" : "Shortage"} valueClass={changeColor} />
              </>
            ) : (
              <>
                <StatRow label="Previous Quantity" value={record.change.split('→')[0]?.trim() || "N/A"} />
                <StatRow label="Adjusted Quantity" value={record.change.split('→')[1]?.trim() || "N/A"} />
                <StatRow label="Change" value={`${record.variance > 0 ? "+" : ""}${record.variance}`} valueClass={changeColor} />
                <StatRow label="Status" value={record.type + (record.variance < 0 ? " / Decrease" : " / Increase")} valueClass={changeColor} />
              </>
            )}
          </div>
        </div>

        {/* Activity Information */}
        <div className="rounded-xl border border-taste-border bg-white shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-4 py-3 border-b border-taste-border">
            <h4 className="font-semibold text-slate-900 text-sm">Activity Information</h4>
          </div>
          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-slate-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 font-medium">Date & Time</div>
                <div className="text-slate-900">{dateFormat.format(new Date(record.timestamp))}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <User size={16} className="text-slate-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 font-medium">Performed By</div>
                <div className="text-slate-900">{record.user.name} <span className="text-slate-400 text-xs ml-1 font-normal bg-slate-100 px-1.5 py-0.5 rounded-full">{record.user.role === "OWNER" ? "Owner / Manager" : "Staff"}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Store size={16} className="text-slate-400 shrink-0" />
              <div>
                <div className="text-xs text-slate-500 font-medium">Branch</div>
                <div className="text-slate-900 capitalize">{currentBranch?.name}</div>
              </div>
            </div>
            {record.reference && record.type !== "Reconciliation" && (
              <div className="flex items-center gap-3">
                <ClipboardList size={16} className="text-slate-400 shrink-0" />
                <div>
                  <div className="text-xs text-slate-500 font-medium">Reference</div>
                  <div className="text-slate-900 font-mono text-xs">{record.reference}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Reason / Description */}
        <div>
          <h4 className="font-semibold text-slate-900 text-sm mb-3">Reason / Description</h4>
          <div className="rounded-xl border border-taste-border bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed shadow-inner">
            {record.reason || <span className="italic text-slate-400">No description provided.</span>}
          </div>
        </div>

        {/* Related Reconciliation Button */}
        {record.type === "Reconciliation" && record.reference && (
          <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-3">Related Reconciliation</h4>
            <div className="flex items-center justify-between p-3 rounded-xl border border-taste-border bg-white shadow-sm">
              <span className="font-mono text-sm text-slate-700">{record.reference}</span>
              <Button size="sm" variant="outline" onClick={() => onNavigateToReconciliation?.(record.reference)}>
                View Reconciliation <ArrowRight size={14} className="ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
}
