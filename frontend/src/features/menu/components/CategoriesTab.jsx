import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Check, Minus, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, CategoryBadge, ConfirmDialog, EmptyState, FormField, Input, Modal, SearchInput, Select, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow } from "../../../components/ui";
import { CATEGORY_COLORS, assignCategoryColor } from "../../../utils/categoryColors";
import FilterDropdown from "./FilterDropdown";

// Same rounded, fully custom-styled checkbox as the Menu Items table (see
// MenuItemsTable.jsx) — native checkboxes render close to square in most
// browsers regardless of border-radius, and their checkmark glyph color
// isn't controllable via className, so this draws its own box + checkmark
// instead of relying on native rendering.
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

function ColorPicker({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Category color">
      {CATEGORY_COLORS.map((color) => (
        <button
          key={color.id}
          type="button"
          role="radio"
          aria-checked={value === color.id}
          aria-label={color.id}
          onClick={() => onChange(color.id)}
          className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 transition"
          style={{ borderColor: value === color.id ? color.swatch : "transparent", backgroundColor: `${color.swatch}22` }}
        >
          <span className="h-4 w-4 rounded-full" style={{ backgroundColor: color.swatch }} />
          {value === color.id && <Check size={12} className="absolute -right-1 -top-1 rounded-full bg-white text-slate-900 shadow" />}
        </button>
      ))}
    </div>
  );
}

function CategoryFormModal({ category, existingCategories, onClose, onSave }) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? assignCategoryColor(category?.id ?? "new", existingCategories));
  const [status, setStatus] = useState(category?.status ?? "ACTIVE");
  const [error, setError] = useState("");
  const isEditing = Boolean(category);

  const submit = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return setError("Enter a category name.");
    if (existingCategories.some((entry) => entry.name.toLowerCase() === trimmedName.toLowerCase() && entry.id !== category?.id)) return setError("That category already exists.");
    onSave({ id: category?.id ?? null, name: trimmedName, color, status });
  };

  return (
    <Modal open onClose={onClose} title={isEditing ? "Edit category" : "Add category"} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="category-form" variant="secondary">{isEditing ? "Save changes" : "Add category"}</Button></>}>
      <form id="category-form" className="space-y-4" noValidate onSubmit={submit}>
        {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>}
        <FormField label="Category name" required><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Beverages" autoFocus /></FormField>
        <FormField label="Color"><ColorPicker value={color} onChange={setColor} /></FormField>
        <FormField label="Status"><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></Select></FormField>
        <div className="rounded-xl bg-slate-50 p-3"><p className="mb-1.5 text-xs font-medium text-slate-500">Preview</p><CategoryBadge name={name.trim() || "Category name"} colorId={color} /></div>
      </form>
    </Modal>
  );
}

function ReassignModal({ category, otherCategories, itemCount, onClose, onConfirm }) {
  const [target, setTarget] = useState("");
  return (
    <Modal open onClose={onClose} title={`Delete "${category.name}"?`} footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button variant="danger" onClick={() => onConfirm(target || null)}>Delete category</Button></>}>
      <div className="space-y-4">
        <p className="text-sm text-slate-600">{itemCount} menu item{itemCount === 1 ? "" : "s"} {itemCount === 1 ? "is" : "are"} tagged with this category.</p>
        {/* Warning — Panel Surface (#FFE2A4 @30%) fill, Warning — Border
            (#B45309 @50%) hairline, Warning — Text Deep (#462B02 @70%) body
            copy, Warning — Icon/Text (#FF9500) for the "Inactive" emphasis. */}
        <div className="rounded-xl border border-[#B45309]/40 bg-[#FFE2A4]/30 p-3 text-sm text-[#462B02]">
          {target
            ? <>Items will be moved to <strong>{otherCategories.find((entry) => entry.id === target)?.name}</strong>.</>
            : <>If you don&apos;t choose a category below, these items will be set to <strong className="text-[#FF9500]">Inactive</strong> instead of being deleted.</>}
        </div>
        {otherCategories.length > 0 && (
          <FormField label="Move items to (optional)" hint="Leave blank to set affected items to Inactive instead.">
            <Select value={target} onChange={(event) => setTarget(event.target.value)}>
              <option value="">Don&apos;t reassign — set items Inactive</option>
              {otherCategories.map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}
            </Select>
          </FormField>
        )}
      </div>
    </Modal>
  );
}

// Status filter dropdown — same custom-panel design as the Menu Items
// filters (see FilterDropdown.jsx), with the same green/gray status dots
// used for Active/Inactive everywhere else in Menu Management.
const STATUS_GROUPS = [{
  options: [
    { value: "ALL", label: "All status" },
    { value: "ACTIVE", label: "Active", dotColor: "#10B981" },
    { value: "INACTIVE", label: "Inactive", dotColor: "#8E8E8E" },
  ],
}];

// Categories tab — replaces the old CategoryManagerModal popup. Lives inside
// Menu Management next to the Menu Items tab (see MenuManagement.jsx tabs).
//
// Layout mirrors the Menu Items tab section-for-section: a flush filter row
// (border-b, no card/box around it), an optional bulk-action bar, a plain
// "Categories / N of M shown" sub-header, then the table in its own padded
// block. The "Add category" button is NOT rendered here — Menu Items keeps
// its "Add Menu Item" button up in the shared tab bar next to the tabs, so
// this exposes `openCreate` through a ref instead of rendering its own
// button, letting MenuManagement put "Add category" in that same tab bar
// row for the two tabs to look identical.
const CategoriesTab = forwardRef(function CategoriesTab({ categories, itemCounts, isOwner, onSave, onDelete }, ref) {
  const [formCategory, setFormCategory] = useState(null); // {} = new, object = editing, null = closed
  const [pendingDelete, setPendingDelete] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const openCreate = () => setFormCategory({});
  useImperativeHandle(ref, () => ({ openCreate }));

  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return categories.filter((category) => {
      const matchesSearch = !normalizedSearch || category.name.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL" || category.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [categories, search, statusFilter]);

  const hasFilters = Boolean(search || statusFilter !== "ALL");

  // Keep the selection in sync with real data — drop ids for categories
  // that no longer exist after a save/delete.
  useEffect(() => {
    setSelectedIds((previous) => {
      const validIds = new Set(categories.map((category) => category.id));
      const next = new Set([...previous].filter((id) => validIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [categories]);

  const openEdit = (category) => setFormCategory(category);
  const handleSave = (form) => { onSave(form); setFormCategory(null); };
  const handleDeleteConfirm = (reassignToCategoryId) => { onDelete(pendingDelete.id, reassignToCategoryId); setPendingDelete(null); };

  const toggleSelect = (categoryId) => setSelectedIds((previous) => {
    const next = new Set(previous);
    if (next.has(categoryId)) next.delete(categoryId); else next.add(categoryId);
    return next;
  });
  const toggleSelectAll = () => setSelectedIds((previous) => {
    const allSelected = filteredCategories.length > 0 && filteredCategories.every((category) => previous.has(category.id));
    return allSelected ? new Set() : new Set(filteredCategories.map((category) => category.id));
  });
  const clearSelection = () => setSelectedIds(new Set());

  const bulkSetStatus = (status) => {
    if (!isOwner || !selectedIds.size) return;
    selectedIds.forEach((categoryId) => {
      const category = categories.find((entry) => entry.id === categoryId);
      if (category && category.status !== status) onSave({ id: category.id, name: category.name, color: category.color, status });
    });
    clearSelection();
  };
  // Bulk delete reuses the same "no reassignment chosen" path as a single
  // delete when you leave the reassign dropdown blank: affected items get
  // set to Inactive rather than deleted. Prompting for a reassign target
  // per-category isn't practical for a multi-select action.
  const confirmBulkDelete = () => {
    if (!isOwner || !selectedIds.size) return;
    selectedIds.forEach((categoryId) => onDelete(categoryId, null));
    setBulkDeleteOpen(false);
    clearSelection();
  };

  const allSelected = isOwner && filteredCategories.length > 0 && filteredCategories.every((category) => selectedIds.has(category.id));
  const someSelected = isOwner && !allSelected && filteredCategories.some((category) => selectedIds.has(category.id));
  const selectAllRef = useRef(null);
  useEffect(() => { if (selectAllRef.current) selectAllRef.current.indeterminate = someSelected; }, [someSelected]);

  return (
    <>
      {/* Filter row — same flush layout as the Menu Items tab: border-b
          only, no surrounding card/box, sits directly under the tab bar. */}
      <div className="flex flex-col gap-3 border-b border-taste-border p-5 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search categories" aria-label="Search categories" className="sm:max-w-xs" />
        <FilterDropdown label="All status" value={statusFilter} onChange={setStatusFilter} groups={STATUS_GROUPS} className="sm:w-40" />
        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setStatusFilter("ALL"); }}>Clear filters</Button>}
      </div>

      {/* Bulk action bar — same flush treatment as Menu Items' bar. */}
      {isOwner && selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-taste-border bg-[#FDEAFA] px-5 py-3">
          <span className="text-sm font-semibold text-[#7A1660]">{selectedIds.size} selected</span>
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            <Button variant="outline" size="sm" onClick={() => bulkSetStatus("ACTIVE")}>Set active</Button>
            <Button variant="outline" size="sm" onClick={() => bulkSetStatus("INACTIVE")}>Set inactive</Button>
            <Button variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
            <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
          </div>
        </div>
      )}

      <div className="px-5 pt-4">
        <h2 className="text-base font-semibold text-slate-900">Categories</h2>
        <p className="mt-1 text-sm text-slate-500">{filteredCategories.length} of {categories.length} categories shown</p>
      </div>

      <div className="p-5">
        {filteredCategories.length ? (
          <Table>
            <TableHeader>
              <TableRow>
                {isOwner && (
                  <TableCell as="th" className="w-10">
                    <SelectCheckbox ref={selectAllRef} checked={allSelected} indeterminate={someSelected} onChange={toggleSelectAll} label="Select all categories" />
                  </TableCell>
                )}
                <TableCell as="th">Category</TableCell>
                <TableCell as="th">Items</TableCell>
                <TableCell as="th">Status</TableCell>
                {isOwner && <TableCell as="th"><span className="sr-only">Actions</span></TableCell>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.map((category) => {
                const isSelected = isOwner && selectedIds.has(category.id);
                return (
                  <TableRow key={category.id} className={isSelected ? "bg-[#FDEAFA]/50" : undefined}>
                    {isOwner && (
                      <TableCell className="w-10">
                        <SelectCheckbox checked={isSelected} onChange={() => toggleSelect(category.id)} label={`Select ${category.name}`} />
                      </TableCell>
                    )}
                    <TableCell><CategoryBadge name={category.name} colorId={category.color} /></TableCell>
                    <TableCell className="text-slate-600">{itemCounts[category.id] ?? 0} item{(itemCounts[category.id] ?? 0) === 1 ? "" : "s"}</TableCell>
                    <TableCell><StatusBadge status={category.status === "ACTIVE" ? "active" : "inactive"} /></TableCell>
                    {isOwner && (
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => openEdit(category)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${category.name}`}><Pencil size={16} /></button>
                          <button type="button" onClick={() => setPendingDelete(category)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title={hasFilters ? "No matching categories" : "No categories yet"}
            description={hasFilters ? "Try a different search or clear the active filters." : "Add a category to start organizing your menu items."}
            action={isOwner && !hasFilters ? <Button variant="secondary" onClick={openCreate}><Plus size={16} />Add category</Button> : null}
          />
        )}
      </div>

      {formCategory !== null && (
        <CategoryFormModal
          category={formCategory.id ? formCategory : null}
          existingCategories={categories}
          onClose={() => setFormCategory(null)}
          onSave={handleSave}
        />
      )}

      {pendingDelete && (itemCounts[pendingDelete.id] ?? 0) === 0 && (
        <ConfirmDialog
          open
          onClose={() => setPendingDelete(null)}
          onConfirm={() => handleDeleteConfirm(null)}
          title="Delete category?"
          description={`"${pendingDelete.name}" has no menu items tagged. This category will be removed permanently.`}
          confirmLabel="Delete category"
          danger
        />
      )}
      {pendingDelete && (itemCounts[pendingDelete.id] ?? 0) > 0 && (
        <ReassignModal
          category={pendingDelete}
          otherCategories={categories.filter((entry) => entry.id !== pendingDelete.id)}
          itemCount={itemCounts[pendingDelete.id]}
          onClose={() => setPendingDelete(null)}
          onConfirm={handleDeleteConfirm}
        />
      )}

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete selected categories?"
        description={`Remove ${selectedIds.size} categor${selectedIds.size === 1 ? "y" : "ies"}? Any menu items tagged with them will be set to Inactive rather than reassigned. This action only changes the current mock session.`}
        confirmLabel={`Delete ${selectedIds.size} categor${selectedIds.size === 1 ? "y" : "ies"}`}
        danger
      />
    </>
  );
});

export default CategoriesTab;