import { useEffect, useMemo, useRef, useState } from "react";
import { ClipboardList, Plus, Tag, TrendingUp, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Button, Card, CategoryBadge, ConfirmDialog, EmptyState, ErrorState, LoadingState, Modal, SearchInput, StatCard, StatusBadge, Toast } from "../../components/ui";
import { ResponsiveGrid } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { deleteMenuCategory, deleteMenuItem, getMockMenuData, saveMenuCategory, saveMenuItem, setMenuAvailability } from "../../services/mock/mockMenuService";
import { getMockIngredients } from "../../services/mock/mockIngredientService";
import { getInventoryStatus } from "../../utils/inventoryStatus";
import { getCategoryColor } from "../../utils/categoryColors";
import CategoriesTab from "./components/CategoriesTab";
import MenuItemCard from "./components/MenuItemCard";
import MenuItemModal from "./components/MenuItemModal";
import MenuItemsTable from "./components/MenuItemsTable";
import MenuImage from "./components/MenuImage";
import ViewToggle from "./components/ViewToggle";
import FilterDropdown from "./components/FilterDropdown";

const TABS = [
  { id: "items", label: "Menu Items" },
  { id: "categories", label: "Categories" },
];

const SORT_GROUPS = [
  { heading: "Updated", options: [{ value: "updated-desc", label: "Recently updated" }] },
  { heading: "Name", options: [{ value: "name-asc", label: "Name (A–Z)" }] },
  { heading: "Price", options: [
    { value: "price-asc", label: "Price (low–high)" },
    { value: "price-desc", label: "Price (high–low)" },
  ] },
];

function MenuManagement() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const isOwner = currentUser?.role === "OWNER";

  const [menuData, setMenuData] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("items");
  const [view, setView] = useState("table"); // "table" | "grid" — Menu Items tab only

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("updated-desc");

  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "" });

  // Multi-select for the Menu Items table — lets an owner set several
  // items Active/Inactive or delete them together instead of one at a time.
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  // CategoriesTab owns its own "add category" modal state internally (same
  // as before), but the button that opens it now lives up here in the
  // shared tab bar — right next to "Add Menu Item" — so both tabs look
  // identical. This ref is how the button reaches into the tab to open it.
  const categoriesTabRef = useRef(null);

  useEffect(() => {
    let isCurrent = true;
    Promise.all([getMockMenuData(currentBranch?.id), getMockIngredients(currentBranch?.id)])
      .then(([data, ingredientData]) => { if (isCurrent) { setMenuData(data); setIngredients(ingredientData); setError(""); } })
      .catch((loadError) => { if (isCurrent) setError(loadError.message); })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [currentBranch?.id]);

  // Keep the selection in sync with real data — drop ids for items that no
  // longer exist after a reload (deleted, or the branch changed).
  useEffect(() => {
    if (!menuData) return;
    setSelectedIds((previous) => {
      const validIds = new Set(menuData.items.map((item) => item.id));
      const next = new Set([...previous].filter((id) => validIds.has(id)));
      return next.size === previous.size ? previous : next;
    });
  }, [menuData]);

  const showToast = (message) => setToast({ open: true, message });
  const categoryName = (categoryId) => menuData?.categories.find((category) => category.id === categoryId)?.name ?? "Uncategorized";

  const filteredItems = useMemo(() => {
    const items = (menuData?.items ?? []).filter((item) => {
      const normalizedSearch = search.trim().toLowerCase();
      const matchesSearch = !normalizedSearch || `${item.name} ${item.description}`.toLowerCase().includes(normalizedSearch);
      const matchesCategory = categoryFilter === "ALL" || item.categoryId === categoryFilter;
      const matchesAvailability = availabilityFilter === "ALL" || item.status === availabilityFilter;
      return matchesSearch && matchesCategory && matchesAvailability;
    });
    const sorted = [...items];
    switch (sortBy) {
      case "name-asc": sorted.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "price-asc": sorted.sort((a, b) => a.price - b.price); break;
      case "price-desc": sorted.sort((a, b) => b.price - a.price); break;
      case "updated-desc":
      default: sorted.sort((a, b) => new Date(b.updatedAt ?? 0) - new Date(a.updatedAt ?? 0));
    }
    return sorted;
  }, [menuData, search, categoryFilter, availabilityFilter, sortBy]);

  const hasFilters = Boolean(search || categoryFilter !== "ALL" || availabilityFilter !== "ALL");

  // Item count per category — used by the Categories tab for the "N items"
  // column and to decide whether deleting a category needs the reassign step.
  const categoryItemCounts = useMemo(() => {
    const counts = {};
    menuData?.items.forEach((item) => { counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1; });
    return counts;
  }, [menuData]);

  // Header stat summary. Note: "Best Selling Category" from the reference
  // design needs real sales data this app doesn't track yet (no units-sold
  // field anywhere in the menu/sales mock data), so it isn't shown here —
  // showing a fabricated number would be worse than omitting it. In its
  // place: how many categories currently have at least one active item,
  // which is a real, honest metric from data we actually have.
  const stats = useMemo(() => {
    const items = menuData?.items ?? [];
    const categories = menuData?.categories ?? [];
    const activeItems = items.filter((item) => item.status === "ACTIVE");
    const averagePrice = items.length ? items.reduce((sum, item) => sum + item.price, 0) / items.length : 0;
    const categoriesInUse = new Set(activeItems.map((item) => item.categoryId)).size;
    return {
      total: items.length,
      activeCount: activeItems.length,
      categoriesCount: categories.length,
      averagePrice,
      categoriesInUse,
    };
  }, [menuData]);

  // Category & status filter dropdown option groups — built here (not as
  // module constants) since categories come from the loaded menu data.
  // Category dots reuse each category's own badge color, so the filter
  // list matches the pills used everywhere else in Menu Management.
  const categoryGroups = useMemo(() => [{
    options: [
      { value: "ALL", label: "All categories" },
      ...(menuData?.categories ?? []).map((category) => ({
        value: category.id,
        label: category.name,
        dotColor: getCategoryColor(category.color, category.name).swatch,
      })),
    ],
  }], [menuData]);

  const statusGroups = [{
    options: [
      { value: "ALL", label: "All status" },
      { value: "ACTIVE", label: "Active", dotColor: "#10B981" },
      { value: "INACTIVE", label: "Inactive", dotColor: "#8E8E8E" },
    ],
  }];

  const reloadMenu = async () => setMenuData(await getMockMenuData(currentBranch.id));

  const handleToggle = async (itemId, isAvailable) => {
    try {
      await setMenuAvailability(currentBranch.id, itemId, isAvailable, { actorRole: currentUser?.role });
      await reloadMenu();
      showToast(isAvailable ? "Menu item is now available." : "Menu item is now unavailable.");
    } catch (actionError) { showToast(actionError.message); }
  };

  // Selection helpers for the Menu Items table's checkbox column.
  const toggleSelect = (itemId) => setSelectedIds((previous) => {
    const next = new Set(previous);
    if (next.has(itemId)) next.delete(itemId); else next.add(itemId);
    return next;
  });
  const toggleSelectAll = () => setSelectedIds((previous) => {
    const allSelected = filteredItems.length > 0 && filteredItems.every((item) => previous.has(item.id));
    return allSelected ? new Set() : new Set(filteredItems.map((item) => item.id));
  });
  const clearSelection = () => setSelectedIds(new Set());

  const bulkSetAvailability = async (isAvailable) => {
    if (!isOwner || !selectedIds.size) return;
    try {
      const count = selectedIds.size;
      await Promise.all([...selectedIds].map((itemId) => setMenuAvailability(currentBranch.id, itemId, isAvailable, { actorRole: currentUser?.role })));
      await reloadMenu();
      showToast(`${count} item${count === 1 ? "" : "s"} set to ${isAvailable ? "Active" : "Inactive"}.`);
      clearSelection();
    } catch (actionError) { showToast(actionError.message); }
  };
  const confirmBulkDelete = async () => {
    if (!isOwner || !selectedIds.size) return;
    try {
      const count = selectedIds.size;
      await Promise.all([...selectedIds].map((itemId) => deleteMenuItem(currentBranch.id, itemId, { actorRole: currentUser.role })));
      await reloadMenu();
      showToast(`${count} item${count === 1 ? "" : "s"} deleted.`);
      setBulkDeleteOpen(false);
      clearSelection();
    } catch (actionError) { showToast(actionError.message); }
  };

  const openCreate = () => { if (isOwner) { setEditingItem(null); setItemModalOpen(true); } };
  const openEdit = (item) => { if (isOwner) { setEditingItem(item); setSelectedItem(null); setItemModalOpen(true); } };

  const handleSaveItem = async (form) => {
    if (!isOwner) return;
    try {
      await saveMenuItem(currentBranch.id, { ...editingItem, ...form }, { actorRole: currentUser.role });
      await reloadMenu();
      setItemModalOpen(false);
      showToast(editingItem ? "Menu item updated." : "Menu item added.");
    } catch (actionError) { showToast(actionError.message); }
  };

  const handleDeleteItem = (item) => { if (isOwner) setPendingDelete(item); };
  const confirmDeleteItem = async () => {
    if (!isOwner || !pendingDelete) return;
    try {
      await deleteMenuItem(currentBranch.id, pendingDelete.id, { actorRole: currentUser.role });
      await reloadMenu();
      setPendingDelete(null);
      showToast("Menu item deleted.");
    } catch (actionError) { showToast(actionError.message); }
  };

  // Categories tab handlers.
  const handleSaveCategory = async ({ id, name, color, status }) => {
    if (!isOwner) return;
    try {
      await saveMenuCategory(currentBranch.id, { id, name, color, status }, { actorRole: currentUser.role });
      await reloadMenu();
      showToast(id ? "Category updated." : "Category added.");
    } catch (actionError) { showToast(actionError.message); }
  };
  const handleDeleteCategory = async (categoryId, reassignToCategoryId) => {
    if (!isOwner) return;
    try {
      await deleteMenuCategory(currentBranch.id, categoryId, { actorRole: currentUser.role, reassignToCategoryId });
      await reloadMenu();
      showToast(reassignToCategoryId ? "Category deleted and items moved." : "Category deleted. Its items were set to Inactive.");
    } catch (actionError) { showToast(actionError.message); }
  };

  if (isLoading) return <PageContainer><LoadingState label="Loading menu" /></PageContainer>;
  if (error || !menuData || !currentBranch) return <PageContainer><ErrorState title="Menu unavailable" description={error || "Select a branch to view its menu."} /></PageContainer>;

  return (
    <PageContainer>
      {/* No page-title block here — the global topbar already shows
          "Menu Management" + the active branch, so repeating it as a
          second H1 was redundant. The stat row starts the page instead,
          matching the reference layout. */}
      <ResponsiveGrid columns="auto">
        <StatCard label="Total Menu Items" value={stats.total} trend={`${stats.activeCount} active items`} icon={UtensilsCrossed} />
        <StatCard label="Categories" value={stats.categoriesCount} trend={`${stats.categoriesInUse} in active use`} icon={Tag} />
        <StatCard label="Average Price" value={`₱${stats.averagePrice.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`} trend="All menu items" icon={TrendingUp} />
        <StatCard label="Active Items" value={stats.activeCount} trend={`${stats.total ? Math.round((stats.activeCount / stats.total) * 100) : 0}% of total`} icon={ClipboardList} />
      </ResponsiveGrid>

      {/* Everything below — tabs, filters, table/grid, pagination-equivalent
          empty states — lives inside one Card, matching the reference's
          single-container layout instead of separate floating sections. */}
      <Card className="mt-6 overflow-hidden">
        {/* Tabs: Menu Items | Categories — Recipes intentionally excluded;
            recipe management lives inside a menu item's own edit view (see
            MenuItemModal.jsx), matching docs/SCREEN_SPECIFICATIONS.md. */}
        <div className="flex items-center justify-between gap-3 border-b border-taste-border px-5 pt-4">
          <div className="flex gap-1" role="tablist" aria-label="Menu Management sections">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-[#F777D1] text-[#F777D1]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          {isOwner && activeTab === "items" && (
            <Button variant="secondary" onClick={openCreate} className="mb-2"><Plus size={16} />Add Menu Item</Button>
          )}
          {isOwner && activeTab === "categories" && (
            <Button variant="secondary" onClick={() => categoriesTabRef.current?.openCreate()} className="mb-2"><Plus size={16} />Add category</Button>
          )}
        </div>

        {activeTab === "items" && (
          <>
            {/* Filters + sort on the left, view toggle on the right. Category
                / status / sort use a custom dropdown (FilterDropdown) instead
                of a native <select> — the browser's own option-list popup
                can't be restyled (rounded corners, colored dots, a pink
                selected row), so a native select always looks like a plain
                square OS list no matter what's on the closed control. */}
            <div className="flex flex-col gap-3 border-b border-taste-border p-5 sm:flex-row sm:items-center">
              <SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu items" aria-label="Search menu items" className="sm:max-w-xs" />
              <FilterDropdown label="All categories" value={categoryFilter} onChange={setCategoryFilter} groups={categoryGroups} className="sm:w-48" />
              <FilterDropdown label="All status" value={availabilityFilter} onChange={setAvailabilityFilter} groups={statusGroups} className="sm:w-40" />
              <FilterDropdown label="Sort: Recently updated" value={sortBy} onChange={setSortBy} groups={SORT_GROUPS} className="sm:w-56" />
              {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryFilter("ALL"); setAvailabilityFilter("ALL"); }}>Clear filters</Button>}
              <div className="sm:ml-auto"><ViewToggle value={view} onChange={setView} /></div>
            </div>

            {/* Bulk action bar — appears once at least one row is selected
                in table view. Owner-only, mirrors the per-row actions. */}
            {isOwner && view === "table" && selectedIds.size > 0 && (
              <div className="flex flex-wrap items-center gap-3 border-b border-taste-border bg-[#FDEAFA] px-5 py-3">
                <span className="text-sm font-semibold text-[#7A1660]">{selectedIds.size} selected</span>
                <div className="flex flex-wrap gap-2 sm:ml-auto">
                  <Button variant="outline" size="sm" onClick={() => bulkSetAvailability(true)}>Set active</Button>
                  <Button variant="outline" size="sm" onClick={() => bulkSetAvailability(false)}>Set inactive</Button>
                  <Button variant="danger" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete</Button>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>Clear</Button>
                </div>
              </div>
            )}

            <div className="px-5 pt-4">
              <h2 className="text-base font-semibold text-slate-900">Menu items</h2>
              <p className="mt-1 text-sm text-slate-500">{filteredItems.length} of {menuData.items.length} items shown</p>
            </div>

            <div className="p-5">
              {filteredItems.length ? (
                view === "table" ? (
                  <MenuItemsTable
                    items={filteredItems}
                    categories={menuData.categories}
                    isOwner={isOwner}
                    onToggle={handleToggle}
                    onDetails={setSelectedItem}
                    onEdit={openEdit}
                    onDelete={handleDeleteItem}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onToggleSelectAll={toggleSelectAll}
                  />
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredItems.map((item) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        categoryName={categoryName(item.categoryId)}
                        categoryColor={menuData.categories.find((category) => category.id === item.categoryId)?.color}
                        isOwner={isOwner}
                        onToggle={handleToggle}
                        onDetails={setSelectedItem}
                        onEdit={openEdit}
                        onDelete={handleDeleteItem}
                      />
                    ))}
                  </div>
                )
              ) : (
                <EmptyState
                  title={hasFilters ? "No matching menu items" : "No menu items yet"}
                  description={hasFilters ? "Try a different search or clear the active filters." : "Add the first menu item for this branch to get started."}
                  action={isOwner && !hasFilters ? <Button variant="secondary" onClick={openCreate}><Plus size={16} />Add Menu Item</Button> : null}
                />
              )}
            </div>
          </>
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            ref={categoriesTabRef}
            categories={menuData.categories}
            itemCounts={categoryItemCounts}
            isOwner={isOwner}
            onSave={handleSaveCategory}
            onDelete={handleDeleteCategory}
          />
        )}
      </Card>

      {/* View-details modal — opened from "View details" on a menu item
          (table row or grid card). Unrelated to the Categories tab. */}
      <Modal
        open={Boolean(selectedItem)}
        onClose={() => setSelectedItem(null)}
        title={selectedItem?.name ?? "Menu item details"}
        footer={<>{isOwner && selectedItem && <Button onClick={() => openEdit(selectedItem)}>Edit item</Button>}<Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button></>}
      >
        {selectedItem && <MenuImage imageUrl={selectedItem.imageUrl} alt={selectedItem.name} className="mb-5 h-48 w-full rounded-xl" />}
        {selectedItem && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <CategoryBadge name={categoryName(selectedItem.categoryId)} colorId={menuData.categories.find((category) => category.id === selectedItem.categoryId)?.color} />
              <StatusBadge status={selectedItem.status === "ACTIVE" ? "active" : "inactive"} />
            </div>
            <p className="text-sm leading-6 text-slate-600">{selectedItem.description || "No description provided."}</p>
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p>
              <p className="mt-1 text-lg font-bold text-slate-900">₱{selectedItem.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p>
            </div>
            <section aria-labelledby="details-recipe-heading">
              <h3 id="details-recipe-heading" className="text-base font-semibold text-slate-900">Recipe / Ingredients</h3>
              {selectedItem.recipe?.length ? (
                <ul className="mt-3 divide-y divide-taste-border rounded-xl border border-taste-border">
                  {selectedItem.recipe.map((entry) => {
                    const ingredient = ingredients.find((option) => option.id === entry.ingredientId);
                    return (
                      <li key={entry.ingredientId} className="flex flex-wrap items-center justify-between gap-3 p-3">
                        <div>
                          <p className="font-medium text-slate-900">{ingredient?.name ?? "Unknown ingredient"}</p>
                          <p className="mt-1 text-sm text-slate-500">{entry.quantity} {entry.unit}</p>
                        </div>
                        {ingredient && (
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span>{ingredient.currentQuantity} {ingredient.unit}</span>
                            <StatusBadge status={getInventoryStatus(ingredient)} />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-500">No recipe ingredients have been configured.</p>
              )}
            </section>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDeleteItem}
        title="Delete menu item?"
        description={`Remove ${pendingDelete?.name ?? "this menu item"} from the ${currentBranch.name} menu? This action only changes the current mock session.`}
        confirmLabel="Delete item"
        danger
      />

      <ConfirmDialog
        open={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title="Delete selected menu items?"
        description={`Remove ${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"} from the ${currentBranch.name} menu? This action only changes the current mock session.`}
        confirmLabel={`Delete ${selectedIds.size} item${selectedIds.size === 1 ? "" : "s"}`}
        danger
      />

      {isOwner && itemModalOpen && (
        <MenuItemModal
          key={editingItem?.id ?? "new"}
          item={editingItem}
          categories={menuData.categories}
          ingredients={ingredients}
          open={itemModalOpen}
          onClose={() => setItemModalOpen(false)}
          onSave={handleSaveItem}
        />
      )}

      <Toast open={toast.open} onClose={() => setToast({ open: false, message: "" })}>{toast.message}</Toast>
    </PageContainer>
  );
}

export default MenuManagement;