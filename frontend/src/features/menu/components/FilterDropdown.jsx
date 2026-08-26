import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "../../../utils/cn";

// A styled stand-in for the filter-row `<select>`s. Browsers don't let you
// restyle a native <select>'s open option list — no rounded corners, no
// custom highlight color, no status dots — which is why "All categories /
// All status / Sort" looked like a plain square OS dropdown no matter what
// classes were on the closed control. This renders its own trigger +
// panel instead, so it can actually match the design (rounded card, pink
// selected row, colored status dots, grouped sort sections).
//
// `groups`: [{ heading?: string, options: [{ value, label, dotColor? }] }]
function FilterDropdown({ label, value, groups, onChange, className, panelClassName }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => { if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false); };
    const handleKeyDown = (event) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const selectedOption = groups.flatMap((group) => group.options).find((option) => option.value === value);

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-10 w-full items-center justify-between gap-2 rounded-xl border bg-white px-3 text-sm font-medium text-slate-700 shadow-xs transition",
          open ? "border-[#F777D1] ring-3 ring-[#F777D1]/15" : "border-taste-border hover:bg-slate-50"
        )}
      >
        <span className="truncate">{selectedOption?.label ?? label}</span>
        <ChevronDown size={16} className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div role="listbox" className={cn("absolute left-0 top-full z-50 mt-2 max-h-72 w-56 overflow-y-auto rounded-2xl border border-taste-border bg-white p-2 shadow-modal", panelClassName)}>
          {groups.map((group, groupIndex) => (
            <div key={group.heading ?? groupIndex} className={groupIndex > 0 ? "mt-1 border-t border-taste-border pt-1" : undefined}>
              {group.heading && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{group.heading}</p>}
              {group.options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => { onChange(option.value); setOpen(false); }}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                      isSelected ? "bg-[#FDEAFA] font-semibold text-[#B82188]" : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    {option.dotColor && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: option.dotColor }} aria-hidden="true" />}
                    <span className="flex-1 truncate">{option.label}</span>
                    {isSelected && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#F777D1]" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FilterDropdown;
