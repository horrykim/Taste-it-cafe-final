import { ChevronDown, Search } from "lucide-react";
import { cn } from "../../utils/cn";

const control = "w-full rounded-xl border border-taste-border bg-white px-3 text-sm text-slate-900 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-[#F777D1] focus:ring-3 focus:ring-[#F777D1]/15 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

export function Input({ className, error, ...props }) { return <input className={cn(control, "h-10", error && "border-rose-500 focus:border-rose-500 focus:ring-rose-100", className)} {...props} />; }
export function Textarea({ className, error, ...props }) { return <textarea className={cn(control, "min-h-24 py-2.5", error && "border-rose-500 focus:border-rose-500 focus:ring-rose-100", className)} {...props} />; }

// `appearance-none` + a custom ChevronDown so every browser renders the
// same flat caret instead of the native OS arrow — the previous version
// used the raw browser default, which is what made the arrow look
// inconsistent and let long labels like "Sort: Recently updated" butt
// right up against it with no breathing room.
export function Select({ className, error, children, ...props }) {
  return (
    <div className="relative">
      <select
        className={cn(control, "h-10 cursor-pointer appearance-none pr-9", error && "border-rose-500 focus:border-rose-500 focus:ring-rose-100", className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
    </div>
  );
}

export function SearchInput({ className, ...props }) { return <div className="relative"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input className={cn("pl-9", className)} type="search" {...props} /></div>; }
export function Checkbox({ label, className, ...props }) { return <label className={cn("inline-flex items-center gap-2 text-sm text-slate-700", className)}><input type="checkbox" className="h-4 w-4 rounded border-taste-border accent-[#F777D1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]" {...props} />{label}</label>; }
export function Radio({ label, className, ...props }) { return <label className={cn("inline-flex items-center gap-2 text-sm text-slate-700", className)}><input type="radio" className="h-4 w-4 border-taste-border accent-[#F777D1] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]" {...props} />{label}</label>; }

// Track + thumb use a flex layout (`inline-flex items-center`) instead of
// absolute positioning. The old version put the thumb at `absolute top-1`
// with no explicit `left`, so its resting position depended on the
// browser's static-position fallback — off by a few px in some renders,
// which is exactly what pushed the thumb past the track's rounded right
// edge once it translated over for the "Active" (checked) state. Flex
// layout removes that ambiguity: the thumb always starts flush at the
// track's own edge, so translate-x-1 / translate-x-6 land it in the same
// place every time, fully inside the pill in both states.
export function Toggle({ label, checked, onChange, disabled = false }) {
  return (
    <label className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={cn(
          "inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1] disabled:opacity-50",
          checked ? "bg-[#F777D1]" : "bg-slate-300"
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </button>
      {label}
    </label>
  );
}

export function FormField({ label, hint, error, children, required = false }) { return <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-800">{label}{required && <span className="ml-1 text-rose-600">*</span>}</span>{children}{error ? <span className="mt-1.5 block text-xs text-rose-600">{error}</span> : hint && <span className="mt-1.5 block text-xs text-slate-500">{hint}</span>}</label>; }