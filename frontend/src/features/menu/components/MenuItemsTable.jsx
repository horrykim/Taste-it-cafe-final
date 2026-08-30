import { forwardRef, useEffect, useRef, useState } from "react";
import { Check, Minus, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button, CategoryBadge, Dropdown, Table, TableBody, TableCell, TableHeader, TableRow, Toggle } from "../../../components/ui";
import MenuImage from "./MenuImage";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" });

// A rounded, fully custom-styled checkbox — native `<input type="checkbox">`
// renders inconsistently across browsers (some ignore border-radius
// entirely, giving a hard square look no matter what CSS is applied) and
// its checkmark glyph color isn't controllable via className. This keeps
// the real input for accessibility/semantics but hides it (`sr-only`) and
// draws the visible box + checkmark itself, so the rounded corners and
// white checkmark are guaranteed everywhere.
const SelectCheckbox = forwardRef(function SelectCheckbox({ checked, indeterminate = false, onChange, label, onClick }, ref) {
  const isFilled = checked || indeterminate;
  return (
    <label className="inline-flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center" onClick={onClick}>
      <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="sr-only" />
      <span
        className={
          "flex h-[18px] w-[18px] items-center justify-center rounded-md border transition-colors " +
          (isFilled ? "border-[#F777D1] bg-[#F777D1]" : "border-taste-border bg-white")
        }
      >
        {checked && <Check size={12} strokeWidth={3} className="text-white" aria-hidden="true" />}
        {!checked && indeterminate && <Minus size={12} strokeWidth={3} className="text-white" aria-hidden="true" />}
      </span>
    </label>
  );
});

// Table view for Menu Items — Item / Category / Price / Status / Updated / Actions.
// `selectedIds` / `onToggleSelect` / `onToggleSelectAll` are optional: when
// omitted (or when the viewer isn't an owner) the checkbox column simply
// isn't rendered, so this stays a drop-in for any caller that doesn't need
// bulk selection.
function MenuItemsTable({ items, categories, isOwner, onToggle, onDetails, onEdit, onDelete, selectedIds, onToggleSelect, onToggleSelectAll }) {
  const [openMenuId, setOpenMenuId] = useState(null);
  const categoryFor = (categoryId) => categories.find((category) => category.id === categoryId);

  const canSelect = isOwner && typeof onToggleSelect === "function";
  const selection = selectedIds ?? new Set();
  const allSelected = canSelect && items.length > 0 && items.every((item) => selection.has(item.id));
  const someSelected = canSelect && !allSelected && items.some((item) => selection.has(item.id));
  const selectAllRef = useRef(null);
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected; }, [someSelected]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          {canSelect && (
            <TableCell as="th" className="w-10">
              <SelectCheckbox ref={selectAllRef} checked={allSelected} indeterminate={someSelected} onChange={onToggleSelectAll} label="Select all menu items" />
            </TableCell>
          )}
          {/* `w-full max-w-0` is what makes truncation possible at all: in a
              table's default auto layout a cell grows to fit its content, so a
              long description widened the whole table and forced a horizontal
              scrollbar. max-w-0 lets this column shrink, w-full lets it take
              whatever space the fixed-width columns leave over. */}
          <TableCell as="th" className="w-full max-w-0">Menu Item</TableCell>
          <TableCell as="th" className="whitespace-nowrap">Category</TableCell>
          <TableCell as="th" className="whitespace-nowrap">Price</TableCell>
          <TableCell as="th" className="whitespace-nowrap">Status</TableCell>
          <TableCell as="th" className="whitespace-nowrap">Updated</TableCell>
          {/* Fixed width + right padding so the kebab button never sits
              flush against the table's outer edge. */}
          <TableCell as="th" className="w-16 text-right"><span className="sr-only">Actions</span></TableCell>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const category = categoryFor(item.categoryId);
          const isSelected = canSelect && selection.has(item.id);
          return (
            <TableRow
              key={item.id}
              onClick={() => onDetails(item)}
              className={
                "cursor-pointer transition-colors hover:bg-slate-50 " + (isSelected ? "bg-[#FDEAFA]/50 hover:bg-[#FDEAFA]/60" : "")
              }
            >
              {canSelect && (
                <TableCell className="w-10" onClick={(event) => event.stopPropagation()}>
                  <SelectCheckbox checked={isSelected} onChange={() => onToggleSelect(item.id)} label={`Select ${item.name}`} />
                </TableCell>
              )}
              <TableCell className="w-full max-w-0">
                <div className="flex items-center gap-3">
                  <MenuImage imageUrl={item.imageUrl} alt={item.name} className="h-11 w-11 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900" title={item.name}>{item.name}</p>
                    {/* Truncated on purpose — the full description is shown in
                        the item details view. `title` gives the whole text on
                        hover without changing the row height. */}
                    <p className="truncate text-xs text-slate-500" title={item.description || undefined}>{item.description || "No description"}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <CategoryBadge name={category?.name ?? "Uncategorized"} colorId={category?.color} />
              </TableCell>
              <TableCell className="whitespace-nowrap font-medium text-slate-900">
                ₱{item.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="whitespace-nowrap" onClick={isOwner ? (event) => event.stopPropagation() : undefined}>
                {isOwner ? (
                  <Toggle
                    label={item.status === "ACTIVE" ? "Active" : "Inactive"}
                    checked={item.status === "ACTIVE"}
                    onChange={(checked) => onToggle(item.id, checked)}
                  />
                ) : (
                  <span className={item.status === "ACTIVE" ? "font-medium text-emerald-700" : "font-medium text-slate-500"}>
                    {item.status === "ACTIVE" ? "Active" : "Inactive"}
                  </span>
                )}
              </TableCell>
              <TableCell className="whitespace-nowrap text-slate-500">
                {item.updatedAt ? dateFormat.format(new Date(item.updatedAt)) : "—"}
              </TableCell>
              {/* View details is no longer a menu entry — clicking anywhere
                  on the row opens it directly (see TableRow's onClick
                  above), matching how this gets used on a tablet: one tap
                  per item instead of open-menu-then-pick-an-option. The
                  kebab now only holds actions that need a second step. */}
              <TableCell className="pr-4" onClick={(event) => event.stopPropagation()}>
                {isOwner && (
                  <div className="relative flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 !p-0"
                      aria-label={`Actions for ${item.name}`}
                      onClick={() => setOpenMenuId(openMenuId === item.id ? null : item.id)}
                    >
                      <MoreHorizontal size={18} />
                    </Button>
                    <Dropdown open={openMenuId === item.id}>
                      <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50" onClick={() => { onEdit(item); setOpenMenuId(null); }}>
                        <Pencil size={16} /> Edit item
                      </button>
                      <button type="button" className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-700 hover:bg-rose-50" onClick={() => { onDelete(item); setOpenMenuId(null); }}>
                        <Trash2 size={16} /> Delete item
                      </button>
                    </Dropdown>
                  </div>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default MenuItemsTable;