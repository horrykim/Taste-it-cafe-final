import { AlertTriangle, CheckCircle2, Circle, Clock3, XCircle, Archive } from "lucide-react";
import { cn } from "../../utils/cn";

const styles = { neutral: "bg-slate-100 text-slate-700", success: "bg-emerald-50 text-emerald-700", warning: "bg-amber-50 text-amber-800", danger: "bg-rose-50 text-rose-700", info: "bg-sky-50 text-sky-700", purple: "bg-taste-purple-soft text-fuchsia-800" };
export function Badge({ children, variant = "neutral", className }) { return <span className={cn("inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold", styles[variant], className)}>{children}</span>; }
const statuses = { normal: ["Normal", "success", CheckCircle2], "low-stock": ["Low stock", "warning", AlertTriangle], "out-of-stock": ["Out of stock", "danger", XCircle], active: ["Active", "success", CheckCircle2], inactive: ["Inactive", "neutral", Circle], pending: ["Pending", "warning", Clock3], completed: ["Completed", "info", CheckCircle2], archived: ["Archived", "neutral", Archive] };
export function StatusBadge({ status, label }) { const [defaultLabel, variant, Icon] = statuses[status] ?? [status, "neutral", Circle]; return <Badge variant={variant}><Icon size={13} aria-hidden="true" />{label ?? defaultLabel}</Badge>; }
