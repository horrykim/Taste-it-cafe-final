import { useEffect, useState } from "react";
import { FolderCog, Plus, UtensilsCrossed } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Badge, Button, ConfirmDialog, EmptyState, ErrorState, LoadingState, Modal, Select, SearchInput, StatusBadge, Toast } from "../../components/ui";
import { ContentSection, FilterBar, PageHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { getMockMenuData } from "../../services/mock/mockMenuService";
import CategoryManagerModal from "./components/CategoryManagerModal";
import MenuItemCard from "./components/MenuItemCard";
import MenuItemModal from "./components/MenuItemModal";

function MenuManagement() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const isOwner = currentUser?.role === "OWNER";
  const [menuData, setMenuData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [itemModalOpen, setItemModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "" });

  useEffect(() => {
    let isCurrent = true;
    getMockMenuData(currentBranch?.id)
      .then((data) => { if (isCurrent) { setMenuData(data); setError(""); } })
      .catch((loadError) => { if (isCurrent) setError(loadError.message); })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [currentBranch?.id]);

  const showToast = (message) => setToast({ open: true, message });
  const categoryName = (categoryId) => menuData?.categories.find((category) => category.id === categoryId)?.name ?? "Uncategorized";
  const filteredItems = menuData?.items.filter((item) => {
    const normalizedSearch = search.trim().toLowerCase();
    const matchesSearch = !normalizedSearch || `${item.name} ${item.description}`.toLowerCase().includes(normalizedSearch);
    const matchesCategory = categoryFilter === "ALL" || item.categoryId === categoryFilter;
    const matchesAvailability = availabilityFilter === "ALL" || item.status === availabilityFilter;
    return matchesSearch && matchesCategory && matchesAvailability;
  }) ?? [];
  const hasFilters = Boolean(search || categoryFilter !== "ALL" || availabilityFilter !== "ALL");

  const handleToggle = (itemId, isAvailable) => {
    if (!currentUser || !["OWNER", "STAFF"].includes(currentUser.role)) return;
    setMenuData((current) => ({ ...current, items: current.items.map((item) => item.id === itemId ? { ...item, status: isAvailable ? "ACTIVE" : "INACTIVE" } : item) }));
    showToast(isAvailable ? "Menu item is now available." : "Menu item is now unavailable.");
  };

  const openCreate = () => { if (isOwner) { setEditingItem(null); setItemModalOpen(true); } };
  const openEdit = (item) => { if (isOwner) { setEditingItem(item); setSelectedItem(null); setItemModalOpen(true); } };
  const handleSaveItem = (form) => {
    if (!isOwner) return;
    setMenuData((current) => {
      if (editingItem) return { ...current, items: current.items.map((item) => item.id === editingItem.id ? { ...item, ...form } : item) };
      const newItem = { ...form, id: `${currentBranch.id}-menu-${current.items.length + 1}`, branchIds: [currentBranch.id], recipeId: null };
      return { ...current, items: [newItem, ...current.items] };
    });
    setItemModalOpen(false);
    showToast(editingItem ? "Menu item updated." : "Menu item added.");
  };

  const handleDeleteItem = (item) => {
    if (!isOwner) return;
    setPendingDelete(item);
  };
  const confirmDeleteItem = () => {
    if (!isOwner || !pendingDelete) return;
    setMenuData((current) => ({ ...current, items: current.items.filter((currentItem) => currentItem.id !== pendingDelete.id) }));
    setPendingDelete(null);
    showToast("Menu item deleted.");
  };

  const handleSaveCategory = ({ id, name }) => {
    if (!isOwner) return;
    setMenuData((current) => {
      if (id) return { ...current, categories: current.categories.map((category) => category.id === id ? { ...category, name } : category) };
      return { ...current, categories: [...current.categories, { id: `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${current.categories.length + 1}`, name, status: "ACTIVE" }] };
    });
    showToast(id ? "Category updated." : "Category added.");
  };
  const handleDeleteCategory = (categoryId) => {
    if (!isOwner) return;
    setMenuData((current) => ({ ...current, categories: current.categories.filter((category) => category.id !== categoryId) }));
    showToast("Category deleted.");
  };

  if (isLoading) return <PageContainer><LoadingState label="Loading menu" /></PageContainer>;
  if (error || !menuData || !currentBranch) return <PageContainer><ErrorState title="Menu unavailable" description={error || "Select a branch to view its menu."} /></PageContainer>;

  return <PageContainer>
    <PageHeader title={isOwner ? "Menu Management" : "Menu"} meta={<Badge variant="purple">{currentBranch.name}</Badge>} description={isOwner ? `Manage menu items and availability for the ${currentBranch.name} branch.` : `View menu items and update availability for the ${currentBranch.name} branch.`} actions={<div className="flex flex-wrap gap-2">{isOwner && <><Button variant="outline" onClick={() => setCategoryModalOpen(true)}><FolderCog size={16} />Categories</Button><Button onClick={openCreate}><Plus size={16} />Add item</Button></>}</div>} />

    <FilterBar className="mt-7"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search menu items" aria-label="Search menu items" className="sm:max-w-xs" /><Select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label="Filter by category" className="sm:max-w-48"><option value="ALL">All categories</option>{menuData.categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select><Select value={availabilityFilter} onChange={(event) => setAvailabilityFilter(event.target.value)} aria-label="Filter by availability" className="sm:max-w-48"><option value="ALL">All availability</option><option value="ACTIVE">Available</option><option value="INACTIVE">Unavailable</option></Select>{hasFilters && <Button variant="ghost" size="sm" onClick={() => { setSearch(""); setCategoryFilter("ALL"); setAvailabilityFilter("ALL"); }}>Clear filters</Button>}</FilterBar>

    <ContentSection className="mt-7"><div className="flex items-center justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-900">Menu items</h2><p className="mt-1 text-sm text-slate-500">{filteredItems.length} of {menuData.items.length} items shown</p></div><UtensilsCrossed size={22} className="text-taste-purple" aria-hidden="true" /></div>{filteredItems.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{filteredItems.map((item) => <MenuItemCard key={item.id} item={item} categoryName={categoryName(item.categoryId)} isOwner={isOwner} onToggle={handleToggle} onDetails={setSelectedItem} onEdit={openEdit} onDelete={handleDeleteItem} />)}</div> : <EmptyState title={hasFilters ? "No matching menu items" : "No menu items yet"} description={hasFilters ? "Try a different search or clear the active filters." : "Add the first menu item for this branch to get started."} action={isOwner && !hasFilters ? <Button onClick={openCreate}><Plus size={16} />Add item</Button> : null} />}</ContentSection>

    <Modal open={Boolean(selectedItem)} onClose={() => setSelectedItem(null)} title={selectedItem?.name ?? "Menu item details"} footer={<>{isOwner && selectedItem && <Button onClick={() => openEdit(selectedItem)}>Edit item</Button>}<Button variant="outline" onClick={() => setSelectedItem(null)}>Close</Button></>}>
      {selectedItem && <div className="space-y-5"><div className="flex flex-wrap items-center gap-2"><Badge variant="purple">{categoryName(selectedItem.categoryId)}</Badge><StatusBadge status={selectedItem.status === "ACTIVE" ? "active" : "inactive"} /></div><p className="text-sm leading-6 text-slate-600">{selectedItem.description || "No description provided."}</p><div className="grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Price</p><p className="mt-1 text-lg font-bold text-slate-900">₱{selectedItem.price.toLocaleString("en-PH", { minimumFractionDigits: 2 })}</p></div><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recipe reference</p><p className="mt-1 text-sm font-medium text-slate-800">{selectedItem.recipeId ? "Recipe linked" : "Not configured"}</p></div></div></div>}
    </Modal>
    <ConfirmDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={confirmDeleteItem} title="Delete menu item?" description={`Remove ${pendingDelete?.name ?? "this menu item"} from the ${currentBranch.name} menu? This action only changes the current mock session.`} confirmLabel="Delete item" danger />
    {isOwner && itemModalOpen && <MenuItemModal key={editingItem?.id ?? "new"} item={editingItem} categories={menuData.categories} open={itemModalOpen} onClose={() => setItemModalOpen(false)} onSave={handleSaveItem} />}
    {isOwner && <CategoryManagerModal categories={menuData.categories} open={categoryModalOpen} onClose={() => setCategoryModalOpen(false)} onSave={handleSaveCategory} onDelete={handleDeleteCategory} />}
    <Toast open={toast.open} onClose={() => setToast({ open: false, message: "" })}>{toast.message}</Toast>
  </PageContainer>;
}

export default MenuManagement;