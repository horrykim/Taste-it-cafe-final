import { LoaderCircle } from "lucide-react";
import { cn } from "../../utils/cn";

const variants = {
  primary: "bg-taste-teal text-slate-900 hover:bg-taste-teal-strong",
  // Primary Pink (#F777D1) — Sign In, Add Branch, Add Menu Item, Add
  // category, active nav highlight, per the Taste It design system. Hover
  // uses Accent Pink (#FF86DB), pressed uses Pink — Pressed (#B82188).
  secondary: "bg-[#F777D1] text-white hover:bg-[#FF86DB] active:bg-[#B82188]",
  outline: "border border-taste-border bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-700 hover:bg-slate-100",
  // Danger — Button (#FF7B7B), used by "Deactivate" / "Delete Category" /
  // "Delete item" confirmations.
  danger: "bg-[#FF7B7B] text-white hover:bg-[#F65F5F] active:bg-[#E24848]",
  subtle: "bg-taste-teal-soft text-slate-800 hover:bg-taste-teal/35",
};

export function Button({ className, variant = "primary", size = "md", loading = false, type = "button", children, disabled = false, ...props }) {
  const sizes = { sm: "h-9 px-3 text-sm", md: "h-10 px-4 text-sm", lg: "h-11 px-5 text-base" };
  return <button type={type} className={cn("inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1] disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)} disabled={loading || disabled} {...props}>{loading && <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />}{children}</button>;
}

export function IconButton({ className, label, size = "md", children, ...props }) {
  const sizes = { sm: "h-8 w-8", md: "h-10 w-10", lg: "h-11 w-11" };
  return <button type="button" aria-label={label} title={label} className={cn("inline-flex items-center justify-center rounded-xl text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1] disabled:pointer-events-none disabled:opacity-50", sizes[size], className)} {...props}>{children}</button>;
}