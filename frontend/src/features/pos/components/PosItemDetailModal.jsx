import { useState } from "react";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button, CategoryBadge, Modal, StatusBadge } from "../../../components/ui";
import { cn } from "../../../utils/cn";
import MenuImage from "../../menu/components/MenuImage";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Item detail view, opened by tapping a product tile.
//
// This is where staff can answer "what's in this?" at the counter and set
// up the order before it hits the cart: pick a quantity and uncheck any
// ingredient the customer can't have. The same removals can still be
// changed later from the cart line, so nothing is locked in here.
function PosItemDetailModal({ item, categoryName, categoryColor, ingredients, onClose, onAdd }) {
  const [quantity, setQuantity] = useState(1);
  const [removedIngredientIds, setRemovedIngredientIds] = useState([]);

  const recipe = item.recipe ?? [];
  const isUnavailable = !item.available || item.status !== "ACTIVE";
  const ingredientName = (ingredientId) => ingredients.find((entry) => entry.id === ingredientId)?.name ?? "Unknown ingredient";

  const toggleIngredient = (ingredientId) => setRemovedIngredientIds((current) => (
    current.includes(ingredientId) ? current.filter((id) => id !== ingredientId) : [...current, ingredientId]
  ));

  return (
    <Modal
      open
      onClose={onClose}
      title={item.name}
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            variant="secondary"
            disabled={isUnavailable}
            onClick={() => onAdd(item, { quantity, removedIngredientIds })}
          >
            <ShoppingCart size={16} aria-hidden="true" />
            Add {quantity} · {money(item.price * quantity)}
          </Button>
        </>
      }
    >
      <MenuImage imageUrl={item.imageUrl} alt={item.name} className="mb-5 h-44 w-full rounded-xl" />

      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <CategoryBadge name={categoryName} colorId={categoryColor} />
          <StatusBadge status={isUnavailable ? "inactive" : "active"} label={isUnavailable ? "Unavailable" : "Available"} />
        </div>

        <p className="text-sm leading-6 text-slate-600">{item.description || "No description provided."}</p>

        {item.availabilityReason && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {item.availabilityReason}
          </p>
        )}

        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
          <p className="mt-1 text-lg font-bold text-slate-900">{money(item.price)}</p>
        </div>

        {/* Quantity */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-800">Quantity</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Decrease quantity"
              disabled={quantity <= 1}
              onClick={() => setQuantity((current) => Math.max(1, current - 1))}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-taste-border bg-white text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
            >
              <Minus size={16} />
            </button>
            <span className="min-w-10 text-center text-base font-semibold text-slate-900">{quantity}</span>
            <button
              type="button"
              aria-label="Increase quantity"
              onClick={() => setQuantity((current) => current + 1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-taste-border bg-white text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        {/* Ingredients — uncheck to leave one out (allergies, preferences). */}
        <section aria-labelledby="detail-ingredients-heading">
          <h3 id="detail-ingredients-heading" className="text-base font-semibold text-slate-900">Ingredients</h3>
          {recipe.length ? (
            <>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                Uncheck anything the customer can&apos;t have. The price stays the same.
              </p>
              <div className="mt-3 divide-y divide-taste-border rounded-xl border border-taste-border">
                {recipe.map((entry) => {
                  const isRemoved = removedIngredientIds.includes(entry.ingredientId);
                  return (
                    <label key={entry.ingredientId} className="flex cursor-pointer items-center gap-3 p-3 text-sm transition-colors hover:bg-slate-50">
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 rounded border-taste-border accent-[#F777D1]"
                        checked={!isRemoved}
                        onChange={() => toggleIngredient(entry.ingredientId)}
                      />
                      <span className={cn("flex-1 truncate", isRemoved ? "text-slate-400 line-through" : "text-slate-800")}>
                        {ingredientName(entry.ingredientId)}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{entry.quantity} {entry.unit}</span>
                    </label>
                  );
                })}
              </div>
              {removedIngredientIds.length > 0 && (
                <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-900">
                  No {removedIngredientIds.map(ingredientName).join(", ")}
                </p>
              )}
            </>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No recipe ingredients have been configured for this item.</p>
          )}
        </section>
      </div>
    </Modal>
  );
}

export default PosItemDetailModal;
