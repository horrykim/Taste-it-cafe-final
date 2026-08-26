import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "../../utils/cn";
import { Button } from "./Button";

export function Table({ className, children }) { return <div className="overflow-hidden rounded-2xl border border-taste-border bg-white shadow-card"><div className="overflow-x-auto"><table className={cn("w-full min-w-[640px] text-left text-sm", className)}>{children}</table></div></div>; }
export function TableHeader({ children }) { return <thead className="border-b border-taste-border bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</thead>; }
export function TableBody({ children }) { return <tbody className="divide-y divide-taste-border">{children}</tbody>; }
export function TableRow({ className, children, ...props }) { return <tr className={cn("transition-colors hover:bg-slate-50/70", className)} {...props}>{children}</tr>; }
export function TableCell({ as: Component = "td", className, children, ...props }) { return <Component className={cn("px-4 py-3.5 align-middle", className)} {...props}>{children}</Component>; }
export function TableToolbar({ children }) { return <div className="flex flex-col gap-3 border border-b-0 border-taste-border bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-t-2xl">{children}</div>; }
export function TablePagination({ page = 1, totalPages = 1, onPrevious, onNext }) { return <div className="flex items-center justify-between gap-3 border border-t-0 border-taste-border bg-white px-4 py-3 text-sm text-slate-600"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><Button variant="outline" size="sm" onClick={onPrevious} disabled={page <= 1} aria-label="Previous page"><ChevronLeft size={16} /></Button><Button variant="outline" size="sm" onClick={onNext} disabled={page >= totalPages} aria-label="Next page"><ChevronRight size={16} /></Button></div></div>; }
