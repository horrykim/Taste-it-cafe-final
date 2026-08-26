import { AlertTriangle, CheckCircle2, Circle, Clock3, XCircle } from "lucide-react";
import { cn } from "../../utils/cn";
import { getCategoryColor } from "../../utils/categoryColors";

// "success" now matches the palette exactly: Success — Surface (#E6F4EA)
// behind Success Green (#10B981) text/icon — this is the "Active" status
// badge on menu items and categories.
const styles = { neutral: "bg-slate-100 text-slate-700", success: "bg-[#E6F4EA] text-[#10B981]", warning: "bg-amber-50 text-amber-800", danger: "bg-rose-50 text-rose-700", info: "bg-sky-50 text-sky-700", purple: "bg-taste-purple-soft text-fuchsia-800" };
export function Badge({ children, variant = "neutral", className }) { return <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold", styles[variant], className)}>{children}</span>; }
const statuses = { normal: ["Normal", "success", CheckCircle2], "low-stock": ["Low stock", "warning", AlertTriangle], "out-of-stock": ["Out of stock", "danger", XCircle], active: ["Active", "success", CheckCircle2], inactive: ["Inactive", "neutral", Circle], pending: ["Pending", "warning", Clock3], completed: ["Completed", "info", CheckCircle2] };
export function StatusBadge({ status, label }) { const [defaultLabel, variant, Icon] = statuses[status] ?? [status, "neutral", Circle]; return <Badge variant={variant}><Icon size={13} aria-hidden="true" />{label ?? defaultLabel}</Badge>; }

// Colorized category pill used in Menu Management (table + grid views) and
// the Categories tab. Color comes from the category's own `color` field
// (see utils/categoryColors.js) so every occurrence of a category stays
// the same color across the app. If a category record doesn't have a
// color saved yet, we derive a stable one from its name instead of always
// falling back to the same swatch — that's what made every category look
// identical before.
export function CategoryBadge({ name, colorId, className }) {
  const color = getCategoryColor(colorId, name);
  return <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold", color.bg, color.text, className)}>{name}</span>;
}