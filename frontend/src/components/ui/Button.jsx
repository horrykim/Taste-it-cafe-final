import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const variants = {
  primary: "bg-taste-teal text-slate-900 hover:bg-taste-teal-strong",
  secondary: "bg-taste-purple text-white hover:bg-taste-purple-strong",
  outline: "border border-taste-border bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700",
  subtle: "bg-taste-teal-soft text-slate-800 hover:bg-taste-teal/35",
};

export function Button({ className, variant = "primary", size = "md", loading = false, type = "button", children, disabled = false, ...props }) {
  const sizes = { sm: "h-9 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-11 px-5 text-base" };
  return <button type={type} className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} disabled={loading || disabled} {...props}>{loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}{children}</button>;
}

export function IconButton({ className, label, size = "md", children, ...props }) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-11 w-11" };
  return <button type="button" aria-label={label} title={label} className={cn("inline-flex items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple disabled:pointer-events-none disabled:opacity-50", sizes[size], className)} {...props}>{children}</button>;
}
