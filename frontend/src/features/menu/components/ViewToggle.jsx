import { LayoutGrid, List } from "lucide-react";
import { cn } from "../../../utils/cn";

const VIEW_OPTIONS = [
  { value: "table", label: "Table view", Icon: List },
  { value: "grid", label: "Grid view", Icon: LayoutGrid },
];

// Segmented table/grid switch for the Menu Items toolbar. Both options are
// always rendered unconditionally — this never hides the option you're not
// currently on, it only fills the active one pink. (The previous version
// used the `bg-taste-pink` / `outline-taste-pink` theme tokens, which
// weren't resolving to a visible color, so the "active" button had no fill
// and both icons looked identical/gray — that's what read as "only one
// button" / "no indicator". Hardcoding the hex here removes that
// dependency entirely, same fix as the rest of Menu Management.)
function ViewToggle({ value, onChange }) {
  return (
    <div role="group" aria-label="Menu items view" className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-taste-border bg-white p-1">
      {VIEW_OPTIONS.map(({ value: optionValue, label, Icon }) => {
        const isActive = value === optionValue;
        return (
          <button
            key={optionValue}
            type="button"
            aria-pressed={isActive}
            title={label}
            onClick={() => onChange(optionValue)}
            className={cn(
              "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]",
              isActive ? "bg-[#F777D1] text-white" : "bg-transparent text-slate-500 hover:bg-slate-100"
            )}
          >
            <Icon size={16} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

export default ViewToggle;