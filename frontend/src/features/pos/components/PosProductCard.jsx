import { Plus } from "lucide-react";
import { Card } from "../../../components/ui";
import { cn } from "../../../utils/cn";
import MenuImage from "../../menu/components/MenuImage";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Product tile for the POS grid. The whole card is the tap target — a
// cashier shouldn't have to hit a small button — with the image given most
// of the height since the picture is how items get recognised at a glance.
function PosProductCard({ item, inCartQuantity = 0, onAdd }) {
  const isUnavailable = !item.available || item.status !== "ACTIVE";

  return (
    <Card
      as="button"
      type="button"
      disabled={isUnavailable}
      onClick={() => !isUnavailable && onAdd(item)}
      aria-label={isUnavailable ? `${item.name}, unavailable` : `Add ${item.name} to cart, ${money(item.price)}`}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden p-0 text-left transition",
        isUnavailable
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer hover:border-[#F777D1] hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
      )}
    >
      <div className="relative">
        <MenuImage imageUrl={item.imageUrl} alt={item.name} className="h-32 w-full" />

        {isUnavailable && (
          <span className="absolute inset-0 flex items-center justify-center bg-white/70 text-sm font-bold text-slate-600">
            Unavailable
          </span>
        )}

        {inCartQuantity > 0 && (
          <span className="absolute right-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-[#F777D1] px-2 text-xs font-bold text-white shadow-sm">
            {inCartQuantity}
          </span>
        )}

        {!isUnavailable && (
          <span
            className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#F777D1] text-white opacity-0 shadow-sm transition group-hover:opacity-100"
            aria-hidden="true"
          >
            <Plus size={17} />
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-3">
        <h3 className="truncate text-sm font-semibold text-slate-900">{item.name}</h3>
        <p className="mt-auto pt-2 text-base font-bold text-slate-900">{money(item.price)}</p>
      </div>
    </Card>
  );
}

export default PosProductCard;
