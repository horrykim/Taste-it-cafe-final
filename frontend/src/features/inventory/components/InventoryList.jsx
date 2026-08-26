import { Card, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui";
import { cn } from "../../../utils/cn";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

export function InventoryList({
  items,
  selected,
  setSelected,
}) {
  return (
    <>
      {/* DESKTOP TABLE */}
      <div className="hidden xl:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table className="w-full text-left border-collapse">
          <TableHeader className="bg-slate-50 border-b border-slate-200">
            <TableRow>
              <TableCell as="th" className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Item</TableCell>
              <TableCell as="th" className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Category</TableCell>
              <TableCell as="th" className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stock</TableCell>
              <TableCell as="th" className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableCell>
              <TableCell as="th" className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Minimum</TableCell>
              <TableCell as="th" className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Maximum</TableCell>
              <TableCell as="th" className="py-4 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Last Updated</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody className="divide-y divide-slate-100">
            {items.map((item) => (
              <TableRow
                key={item.id}
                className={cn(
                  "cursor-pointer transition-all hover:bg-slate-50 group",
                  selected?.id === item.id ? "bg-pink-50/40 relative" : ""
                )}
                onClick={() => setSelected(item)}
              >
                {selected?.id === item.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-taste-pink rounded-r-full" />
                )}
                <TableCell className="py-4 px-5 align-middle">
                  <p className="font-semibold text-slate-900 group-hover:text-taste-purple transition-colors">{item.name}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{item.supplier || "No supplier"}</p>
                </TableCell>
                <TableCell className="py-4 px-5 align-middle">
                  <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                    {item.category}
                  </span>
                </TableCell>
                <TableCell className="py-4 px-5 align-middle">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-lg font-bold text-slate-900">{formatNumber(item.currentQuantity)}</span>
                    <span className="text-sm font-medium text-slate-500">{item.unit}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-5 align-middle">
                  <StatusBadge status={item.status} />
                </TableCell>
                <TableCell className="py-4 px-5 align-middle text-slate-600">
                  {formatNumber(item.lowStockThreshold)} {item.unit}
                </TableCell>
                <TableCell className="py-4 px-5 align-middle text-slate-600">
                  {formatNumber(item.targetStockLevel)} {item.unit}
                </TableCell>
                <TableCell className="py-4 px-5 align-middle whitespace-nowrap text-right text-sm text-slate-500">
                  {dateFormat.format(new Date(item.lastUpdated))}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* MOBILE / TABLET CARDS */}
      <div className="grid gap-3 xl:hidden">
        {items.map((item) => (
          <Card
            key={item.id}
            className={cn(
              "cursor-pointer p-4 transition-all hover:shadow-md",
              selected?.id === item.id ? "bg-pink-50/40 border-taste-pink ring-1 ring-taste-pink/20" : "border-slate-200"
            )}
            onClick={() => setSelected(item)}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h3 className="font-bold text-slate-900">{item.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-medium text-slate-500">{item.category}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-xs text-slate-400">{item.supplier || "No supplier"}</span>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>
            
            <div className="flex flex-wrap items-baseline gap-1.5 mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-2">Stock:</span>
              <span className="text-xl font-extrabold text-slate-900">
                {formatNumber(item.currentQuantity)}
              </span>
              <span className="font-semibold text-slate-500">{item.unit}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block mb-0.5">Min</span>
                <span className="font-medium">{formatNumber(item.lowStockThreshold)} {item.unit}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Max</span>
                <span className="font-medium">{formatNumber(item.targetStockLevel)} {item.unit}</span>
              </div>
              <div className="col-span-2 mt-1 text-slate-400">
                Updated: {dateFormat.format(new Date(item.lastUpdated))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
