import { cn } from "../../../utils/cn";
import { getCategoryColor } from "../../../utils/categoryColors";

// Horizontal category tabs across the top of the POS catalog — this is the
// primary way a cashier narrows the grid, replacing a category dropdown.
// Each tab carries its category's own dot color so it matches the pills
// used elsewhere in the app. Scrolls sideways on narrow screens instead of
// wrapping, so the row stays one line on a tablet.
function PosCategoryTabs({ categories, value, onChange, counts = {} }) {
  const tabs = [
    { id: "ALL", name: "All items", color: null },
    ...categories.map((category) => ({ id: category.id, name: category.name, color: category.color })),
  ];

  return (
    <div
      role="tablist"
      aria-label="Menu categories"
      className="flex gap-1 overflow-x-auto border-b border-taste-border px-5 pt-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        const swatch = tab.id === "ALL" ? null : getCategoryColor(tab.color, tab.name).swatch;
        const count = counts[tab.id];

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              "-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors",
              isActive
                ? "border-[#F777D1] text-[#F777D1]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            {swatch && <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: swatch }} aria-hidden="true" />}
            {tab.name}
            {typeof count === "number" && (
              <span className={cn("rounded-full px-1.5 py-0.5 text-[11px] font-bold", isActive ? "bg-[#FDEAFA] text-[#B82188]" : "bg-slate-100 text-slate-500")}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default PosCategoryTabs;