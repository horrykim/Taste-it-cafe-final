import { AlertCircle, Clock3, History, TrendingDown, TrendingUp } from "lucide-react";
import { Button, EmptyState, ErrorState, LoadingState, StatusBadge } from "../../../components/ui";
import { getHistoryChangeTone } from "../../../utils/inventoryHistory";
import { cn } from "../../../utils/cn";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function ActivityIcon({ tone }) {
  const Icon = tone === "positive" ? TrendingUp : tone === "negative" ? TrendingDown : Clock3;
  const className =
    tone === "positive"
      ? "bg-emerald-50 text-emerald-600"
      : tone === "negative"
        ? "bg-rose-50 text-rose-600"
        : "bg-slate-100 text-slate-500";

  return (
    <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full", className)}>
      <Icon size={15} />
    </div>
  );
}

function MovementBadge({ movementType, label }) {
  const status = movementType === "sale" ? "pending" : "completed";
  return <StatusBadge status={status} label={label} />;
}

function HistoryRow({ entry, inventoryMap, showItemName = false, compact = false }) {
  const tone = getHistoryChangeTone(entry);
  const changeClass =
    tone === "positive"
      ? "text-emerald-600"
      : tone === "negative"
        ? "text-rose-600"
        : "text-slate-700";
  const item = inventoryMap?.get?.(entry.itemId) || null;
  const itemName = item?.name || entry.itemName || entry.itemId;

  return (
    <div className={cn("flex gap-3 rounded-xl border border-slate-200 bg-white shadow-sm", compact ? "p-3" : "p-4")}>
      <ActivityIcon tone={tone} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">{entry.type}</p>
              <MovementBadge movementType={entry.movementType} label={entry.type} />
            </div>
            <p className="mt-1 text-xs font-medium text-slate-400">
              {dateFormat.format(new Date(entry.timestamp))}
            </p>
          </div>
          <p className={cn("text-sm font-bold tabular-nums", changeClass)}>{entry.signedChange}</p>
        </div>

        {showItemName ? (
          <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-[auto_1fr] sm:items-center">
            <span className="font-medium text-slate-500">Item</span>
            <span className="font-semibold text-slate-900">{itemName}</span>
          </div>
        ) : null}

        <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="font-medium text-slate-500">Stock</span>
          <span className="font-semibold text-slate-900">{entry.quantityBefore} -&gt; {entry.quantityAfter}</span>
        </div>

        <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-[auto_1fr] sm:items-center">
          <span className="font-medium text-slate-500">By</span>
          <span>
            <span className="font-semibold text-slate-900">{entry.user.name}</span>
            <span className="ml-2 text-xs text-slate-400">
              {entry.user.role === "OWNER" ? "Owner / Manager" : "Staff"}
            </span>
          </span>
        </div>

        {entry.reason ? (
          <div className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-[auto_1fr]">
            <span className="font-medium text-slate-500">Reason</span>
            <span className="text-slate-700">{entry.reason}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function InventoryHistoryList({
  entries,
  inventoryMap,
  showItemName = false,
  compact = false,
  loading = false,
  error = "",
  emptyTitle = "No recent activity recorded",
  emptyDescription = "There are no recorded inventory movements for this branch yet.",
  loadingLabel = "Loading inventory history",
  retryLabel = "Retry",
  onRetry,
  footerAction,
}) {
  if (loading) {
    return <LoadingState label={loadingLabel} />;
  }

  if (error) {
    return (
      <ErrorState
        title="Unable to load recent activity"
        description={error}
        action={onRetry ? <Button variant="outline" onClick={onRetry}>{retryLabel}</Button> : null}
      />
    );
  }

  if (!entries.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-4">
      {entries.map((entry) => (
        <HistoryRow
          key={entry.id}
          entry={entry}
          inventoryMap={inventoryMap}
          showItemName={showItemName}
          compact={compact}
        />
      ))}
      {footerAction ? <div className="pt-1">{footerAction}</div> : null}
    </div>
  );
}

export function InventoryHistoryInlineEmpty() {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center">
      <History className="mx-auto mb-2 text-slate-300" size={24} />
      <p className="text-sm font-medium text-slate-400">No recent activity recorded</p>
    </div>
  );
}

export function InventoryHistoryInlineError({ message, onRetry }) {
  return (
    <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
      <div className="flex items-start gap-2">
        <AlertCircle size={16} className="mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Unable to load recent activity</p>
          <p className="mt-1 text-rose-600">{message}</p>
          {onRetry ? (
            <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
              Retry
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
