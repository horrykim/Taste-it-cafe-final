import { useState } from "react";
import { ChevronDown, Minus, Plus, Trash2 } from "lucide-react";
import { cn } from "../../../utils/cn";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// One line in the current transaction.
//
// The collapsible "Ingredients" section is what lets a cashier handle
// allergies and preferences at the counter: unchecking an ingredient marks
// it as removed for that line only (e.g. "no onions"). Removals don't
// change the price — they're a preparation note for the kitchen, not a
// discount — and they're scoped to this cart line, so the same item added
// again starts from the full recipe.
function CartLineItem({ line, ingredients, onUpdateQuantity, onRemove, onToggleIngredient }) {
  const [expanded, setExpanded] = useState(false);

  const recipe = line.recipe ?? [];
  const removed = line.removedIngredientIds ?? [];
  const hasRecipe = recipe.length > 0;
  const ingredientName = (ingredientId) => ingredients.find((entry) => entry.id === ingredientId)?.name ?? "Unknown ingredient";

  return (
    <div className="rounded-xl border border-taste-border bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{line.name}</p>
          <p className="mt-0.5 text-xs text-slate-500">{money(line.price)} each</p>
        </div>
        <button
          type="button"
          aria-label={`Remove ${line.name}`}
          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
          onClick={() => onRemove(line.lineId)}
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Removed-ingredient summary stays visible while collapsed so the
          cashier can confirm the customisation at a glance. */}
      {removed.length > 0 && (
        <p className="mt-2 rounded-lg bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-900">
          No {removed.map(ingredientName).join(", ")}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            aria-label={`Decrease quantity for ${line.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-taste-border bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
            onClick={() => onUpdateQuantity(line.lineId, -1)}
          >
            <Minus size={15} />
          </button>
          <span className="min-w-8 text-center text-sm font-semibold text-slate-900">{line.quantity}</span>
          <button
            type="button"
            aria-label={`Increase quantity for ${line.name}`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-taste-border bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
            onClick={() => onUpdateQuantity(line.lineId, 1)}
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-500">Line total</p>
          <p className="text-base font-bold text-slate-900">{money(line.price * line.quantity)}</p>
        </div>
      </div>

      {hasRecipe && (
        <div className="mt-3 border-t border-taste-border pt-2">
          <button
            type="button"
            aria-expanded={expanded}
            onClick={() => setExpanded((current) => !current)}
            className="flex w-full items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
          >
            <span>Ingredients ({recipe.length})</span>
            <ChevronDown size={15} className={cn("shrink-0 text-slate-400 transition-transform", expanded && "rotate-180")} aria-hidden="true" />
          </button>

          {expanded && (
            <div className="mt-1 space-y-0.5">
              <p className="px-1 pb-1 text-[11px] leading-4 text-slate-500">
                Uncheck an ingredient to leave it out (allergies, preferences). The price stays the same.
              </p>
              {recipe.map((entry) => {
                const isRemoved = removed.includes(entry.ingredientId);
                return (
                  <label
                    key={entry.ingredientId}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1.5 text-xs transition-colors hover:bg-slate-50"
                  >
                    <input
                      type="checkbox"
                      className="h-3.5 w-3.5 shrink-0 rounded border-taste-border accent-[#F777D1]"
                      checked={!isRemoved}
                      onChange={() => onToggleIngredient(line.lineId, entry.ingredientId)}
                    />
                    <span className={cn("flex-1 truncate", isRemoved ? "text-slate-400 line-through" : "text-slate-700")}>
                      {ingredientName(entry.ingredientId)}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-400">{entry.quantity} {entry.unit}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CartLineItem;