import { CheckCircle2, ClipboardCheck } from "lucide-react";
import { Button, Card, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui";
import { cn } from "../../../utils/cn";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);
const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

const STATUS_DOT = {
  normal: "bg-emerald-400",
  "low-stock": "bg-amber-400",
  "out-of-stock": "bg-rose-500",
};

const CATEGORY_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-teal-100 text-teal-700",
  "bg-rose-100 text-rose-700",
  "bg-amber-100 text-amber-700",
  "bg-indigo-100 text-indigo-700",
];

const categoryColorCache = {};
let colorIndex = 0;
function getCategoryColor(name) {
  if (!categoryColorCache[name]) {
    categoryColorCache[name] = CATEGORY_COLORS[colorIndex % CATEGORY_COLORS.length];
    colorIndex += 1;
  }
  return categoryColorCache[name];
}

function StockGauge({ current, threshold, status }) {
  const max = Math.max(threshold * 3, current, 1);
  const pct = Math.min((current / max) * 100, 100);
  const barColor =
    status === "out-of-stock" ? "bg-rose-400" :
    status === "low-stock" ? "bg-amber-400" :
    "bg-emerald-400";

  return (
    <div className="flex min-w-[100px] items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
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

export function InventoryList({
  items,
  selected,
  setSelected,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onQuickReconcile,
}) {
  const selectedSet = new Set(selectedIds);
  const allSelected = items.length > 0 && items.every((item) => selectedSet.has(item.id));

  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:block">
        <Table className="w-full border-collapse text-left">
          <TableHeader className="border-b border-slate-200 bg-slate-50">
            <TableRow>
              <TableCell as="th" className="w-12 px-4 py-3.5">
                <SelectionCheckbox
                  checked={allSelected}
                  onChange={() => onToggleSelectAll?.(items)}
                  label="Select visible inventory items"
                />
              </TableCell>
              <TableCell as="th" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Item</TableCell>
              <TableCell as="th" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Category</TableCell>
              <TableCell as="th" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Stock</TableCell>
              <TableCell as="th" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Status</TableCell>
              <TableCell as="th" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Min Alert</TableCell>
              <TableCell as="th" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500">Reconcile</TableCell>
              <TableCell as="th" className="px-5 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">Updated</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {items.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  "group cursor-pointer transition-all hover:bg-slate-50",
                  selected?.id === item.id ? "relative bg-taste-purple-soft" : ""
                )}
                onClick={() => setSelected(item)}
              >
                <TableCell className="px-4 py-4 align-middle" onClick={(event) => event.stopPropagation()}>
                  <SelectionCheckbox
                    checked={selectedSet.has(item.id)}
                    onChange={() => onToggleSelect?.(item.id)}
                    label={`Select ${item.name} for targeted reconciliation`}
                  />
                </TableCell>
                <TableCell className="relative px-5 py-4 align-middle">
                  {selected?.id === item.id && (
                    <div className="absolute bottom-0 left-0 top-0 w-1 rounded-r-full bg-taste-purple" />
                  )}
                  <div className="flex items-center gap-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[item.status] ?? "bg-slate-300"}`} />
                    <p className="font-semibold text-slate-900 transition-colors group-hover:text-taste-purple">{item.name}</p>
                  </div>
                </TableCell>
                <TableCell className="px-5 py-4 align-middle">
                  <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold", getCategoryColor(item.category))}>
                    {item.category}
                  </span>
                </TableCell>
                <TableCell className="min-w-[160px] px-5 py-4 align-middle">
                  <div className="mb-1.5 flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-slate-900">{formatNumber(item.currentQuantity)}</span>
                    <span className="text-xs font-medium text-slate-500">{item.unit}</span>
                  </div>
                  <StockGauge current={item.currentQuantity} threshold={item.lowStockThreshold} status={item.status} />
                </TableCell>
                <TableCell className="px-5 py-4 align-middle">
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="px-5 py-4 align-middle text-sm text-slate-600">
                  {formatNumber(item.lowStockThreshold)} {item.unit}
                </TableCell>
                <TableCell className="px-5 py-4 align-middle" onClick={(event) => event.stopPropagation()}>
                  <Button variant="outline" size="sm" onClick={() => onQuickReconcile?.(item.id)}>
                    <ClipboardCheck size={14} />
                    Reconcile
                  </Button>
                </TableCell>
                <TableCell className="whitespace-nowrap px-5 py-4 text-right text-xs text-slate-400">
                  {dateFormat.format(new Date(item.lastUpdated))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid gap-3 xl:hidden">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "cursor-pointer p-4 transition-all hover:shadow-md",
              selected?.id === item.id ? "border-taste-purple bg-taste-purple-soft ring-1 ring-taste-purple/20" : "border-slate-200"
            )}
            onClick={() => setSelected(item)}
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="flex min-w-0 flex-1 items-start gap-3">
                <div onClick={(event) => event.stopPropagation()} className="pt-0.5">
                  <SelectionCheckbox
                    checked={selectedSet.has(item.id)}
                    onChange={() => onToggleSelect?.(item.id)}
                    label={`Select ${item.name} for targeted reconciliation`}
                  />
                </div>
                <div className="flex min-w-0 flex-1 items-center gap-2.5">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[item.status] ?? "bg-slate-300"}`} />
                  <div className="min-w-0">
                    <h3 className="truncate font-bold text-slate-900">{item.name}</h3>
                    <span className={cn("mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold", getCategoryColor(item.category))}>
                      {item.category}
                    </span>
                  </div>
                </div>
              </div>
              {selectedSet.has(item.id) ? <CheckCircle2 size={18} className="text-taste-purple" /> : null}
            </div>

            <div className="mb-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
              <div className="mb-2 flex items-baseline gap-1.5">
                <span className="text-xl font-extrabold text-slate-900">{formatNumber(item.currentQuantity)}</span>
                <span className="text-sm font-semibold text-slate-500">{item.unit}</span>
              </div>
              <StockGauge current={item.currentQuantity} threshold={item.lowStockThreshold} status={item.status} />
            </div>

            <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
              <span>Min: <strong className="text-slate-700">{formatNumber(item.lowStockThreshold)} {item.unit}</strong></span>
              <StatusBadge status={item.status} />
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <span className="text-xs text-slate-500">{dateFormat.format(new Date(item.lastUpdated))}</span>
              <Button variant="outline" size="sm" onClick={(event) => { event.stopPropagation(); onQuickReconcile?.(item.id); }}>
                <ClipboardCheck size={14} />
                Reconcile
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
