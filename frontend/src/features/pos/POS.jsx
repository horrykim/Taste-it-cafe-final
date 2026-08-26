import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Button, Card, EmptyState, ErrorState, LoadingState, SearchInput, Toast } from "../../components/ui";
import PageContainer from "../../components/layout/PageContainer";
import { createPosTransaction, getPosCatalogData } from "../../services/mock/mockPosService";
import { getMockIngredients } from "../../services/mock/mockIngredientService";
import FilterDropdown from "../menu/components/FilterDropdown";
import PosCategoryTabs from "./components/PosCategoryTabs";
import PosProductCard from "./components/PosProductCard";
import PosItemDetailModal from "./components/PosItemDetailModal";
import CartPanel from "./components/CartPanel";
import ReceiptModal from "./components/ReceiptModal";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Status is the only filter dropdown here — a POS should stay fast, and
// category filtering is handled by the tab row instead.
const STATUS_GROUPS = [{
  options: [
    { value: "ALL", label: "All items" },
    { value: "AVAILABLE", label: "Available", dotColor: "#10B981" },
    { value: "UNAVAILABLE", label: "Unavailable", dotColor: "#8E8E8E" },
  ],
}];

export default function POS() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();

  const [data, setData] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeCategory, setActiveCategory] = useState("ALL");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [detailItem, setDetailItem] = useState(null);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [reference, setReference] = useState("");
  const [sale, setSale] = useState(null);
  const [saleCustomisations, setSaleCustomisations] = useState({});
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });
  const branchId = currentBranch?.id;

  const notify = (message, variant = "success") => setToast({ open: true, message, variant });

  const refreshCatalog = async () => {
    if (!currentBranch?.id) { setData(null); setIsLoading(false); return null; }
    try {
      setIsLoading(true);
      // Ingredients are loaded alongside the catalog so cart lines can list
      // their recipe by name for the allergy / customisation dropdown.
      const [catalog, ingredientData] = await Promise.all([
        getPosCatalogData(currentBranch.id),
        getMockIngredients(currentBranch.id),
      ]);
      setData(catalog);
      setIngredients(ingredientData);
      setError("");
      return catalog;
    } catch (loadError) {
      setError(loadError.message || "Unable to load the POS catalog.");
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [branchId]);

  useEffect(() => { void refreshCatalog(); }, [currentBranch?.id]);

  // Reset the active tab if the branch changes and that category is gone.
  useEffect(() => {
    if (!data || activeCategory === "ALL") return;
    if (!data.categories.some((category) => category.id === activeCategory)) setActiveCategory("ALL");
  }, [data, activeCategory]);

  const isItemAvailable = (item) => item.available && item.status === "ACTIVE";

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const normalizedSearch = search.trim().toLowerCase();
    return data.items.filter((item) => {
      const matchesSearch = !normalizedSearch || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(normalizedSearch);
      const matchesCategory = activeCategory === "ALL" || item.categoryId === activeCategory;
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "AVAILABLE" ? isItemAvailable(item) : !isItemAvailable(item));
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [data, search, activeCategory, statusFilter]);

  // Per-tab counts, respecting the search + status filters so the numbers
  // match what each tab would actually show.
  const categoryCounts = useMemo(() => {
    if (!data) return {};
    const normalizedSearch = search.trim().toLowerCase();
    const base = data.items.filter((item) => {
      const matchesSearch = !normalizedSearch || `${item.name} ${item.description ?? ""}`.toLowerCase().includes(normalizedSearch);
      const matchesStatus = statusFilter === "ALL"
        || (statusFilter === "AVAILABLE" ? isItemAvailable(item) : !isItemAvailable(item));
      return matchesSearch && matchesStatus;
    });
    const counts = { ALL: base.length };
    base.forEach((item) => { counts[item.categoryId] = (counts[item.categoryId] ?? 0) + 1; });
    return counts;
  }, [data, search, statusFilter]);

  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.price * line.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);

  // Total quantity per menu item across all lines — drives the badge on the
  // product tile (an item can appear as several lines with different
  // ingredient removals).
  const cartQuantities = useMemo(() => {
    const quantities = {};
    cart.forEach((line) => { quantities[line.menuItemId] = (quantities[line.menuItemId] ?? 0) + line.quantity; });
    return quantities;
  }, [cart]);

  const enteredCash = Number(amountReceived || 0);
  const cashChange = paymentMethod === "CASH" ? Math.max(enteredCash - subtotal, 0) : 0;
  const insufficientCash = paymentMethod === "CASH" && subtotal > 0 && enteredCash < subtotal;
  const hasValidPayment = paymentMethod === "CASH" ? subtotal > 0 && !insufficientCash : Boolean(reference.trim());
  const canComplete = cart.length > 0 && hasValidPayment;

  // `options` comes from the detail modal (quantity + ingredients removed
  // up front). Adding straight from a tile's "Add to cart" button passes
  // nothing, so it defaults to one unmodified item.
  const addToCart = (item, options = {}) => {
    if (!isItemAvailable(item)) { notify("This item is currently unavailable.", "warning"); return; }
    const quantity = Math.max(1, options.quantity ?? 1);
    const removedIngredientIds = options.removedIngredientIds ?? [];

    setCart((current) => {
      // Merge into an existing line only when both that line and the
      // incoming one are unmodified — a customised line stays separate so
      // its removals aren't silently applied to the newly added item.
      const canMerge = removedIngredientIds.length === 0;
      const existing = canMerge
        ? current.find((line) => line.menuItemId === item.id && (line.removedIngredientIds?.length ?? 0) === 0)
        : null;
      if (existing) return current.map((line) => (line.lineId === existing.lineId ? { ...line, quantity: line.quantity + quantity } : line));
      return [...current, {
        lineId: `${item.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity,
        recipe: item.recipe ?? [],
        removedIngredientIds,
      }];
    });

    notify(`${quantity} × ${item.name} added to cart.`);
  };

  const addFromDetails = (item, options) => { addToCart(item, options); setDetailItem(null); };

  const updateQuantity = (lineId, delta) => setCart((current) => current.flatMap((line) => {
    if (line.lineId !== lineId) return [line];
    const nextQuantity = line.quantity + delta;
    return nextQuantity <= 0 ? [] : [{ ...line, quantity: nextQuantity }];
  }));

  const removeItem = (lineId) => setCart((current) => current.filter((line) => line.lineId !== lineId));

  // Toggle one ingredient off/on for a single cart line (allergies etc).
  const toggleIngredient = (lineId, ingredientId) => setCart((current) => current.map((line) => {
    if (line.lineId !== lineId) return line;
    const removed = line.removedIngredientIds ?? [];
    return {
      ...line,
      removedIngredientIds: removed.includes(ingredientId)
        ? removed.filter((id) => id !== ingredientId)
        : [...removed, ingredientId],
    };
  }));

  const resetPayment = () => { setPaymentMethod("CASH"); setAmountReceived(""); setReference(""); };

  const handleCompleteSale = async () => {
    if (!currentBranch?.id || !currentUser || !canComplete) return;
    try {
      // Capture removals before the cart is cleared so the receipt can show
      // them — the mock transaction service doesn't store per-line notes.
      const customisations = {};
      cart.forEach((line) => {
        const removedNames = (line.removedIngredientIds ?? [])
          .map((id) => ingredients.find((entry) => entry.id === id)?.name)
          .filter(Boolean);
        if (removedNames.length) customisations[line.menuItemId] = removedNames;
      });

      const result = await createPosTransaction(
        currentBranch.id,
        cart,
        { method: paymentMethod, reference: paymentMethod === "GCASH" ? reference.trim() : "" },
        currentUser
      );

      setSale(result);
      setSaleCustomisations(customisations);
      setCart([]);
      resetPayment();
      notify(`Sale completed. Transaction #${result.transactionId}`, "success");
      await refreshCatalog();
    } catch (actionError) {
      notify(actionError.message || "Unable to complete the sale.", "danger");
    }
  };

  const hasFilters = Boolean(search || statusFilter !== "ALL");
  const clearFilters = () => { setSearch(""); setStatusFilter("ALL"); };

  if (isLoading) return <PageContainer><LoadingState label="Loading POS catalog" /></PageContainer>;
  if (error || !data || !currentBranch) return <PageContainer><ErrorState title="POS unavailable" description={error || "Select a branch to continue."} /></PageContainer>;

  return (
    <PageContainer>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <Card className="overflow-hidden">
          {/* Category tabs are the primary filter — one tap per category. */}
          <PosCategoryTabs
            categories={data.categories}
            value={activeCategory}
            onChange={setActiveCategory}
            counts={categoryCounts}
          />

          <div className="flex flex-col gap-3 border-b border-taste-border p-5 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search menu items"
              aria-label="Search menu items"
              className="sm:max-w-sm"
            />
            <FilterDropdown label="All items" value={statusFilter} onChange={setStatusFilter} groups={STATUS_GROUPS} className="sm:w-44" />
            {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear</Button>}
            <p className="text-sm text-slate-500 sm:ml-auto">{filteredItems.length} item{filteredItems.length === 1 ? "" : "s"}</p>
          </div>

          <div className="p-5">
            {filteredItems.length ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
                {filteredItems.map((item) => (
                  <PosProductCard
                    key={item.id}
                    item={item}
                    inCartQuantity={cartQuantities[item.id] ?? 0}
                    onAdd={addToCart}
                    onDetails={setDetailItem}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={hasFilters || activeCategory !== "ALL" ? "No matching items" : "No menu items available"}
                description={hasFilters || activeCategory !== "ALL" ? "Try another category, or clear the search and status filter." : "This branch has no sellable menu items yet."}
                action={hasFilters ? <Button variant="ghost" onClick={clearFilters}>Clear</Button> : null}
              />
            )}
          </div>
        </Card>

        <CartPanel
          cart={cart}
          ingredients={ingredients}
          subtotal={subtotal}
          cartCount={cartCount}
          paymentMethod={paymentMethod}
          amountReceived={amountReceived}
          reference={reference}
          cashChange={cashChange}
          insufficientCash={insufficientCash}
          canComplete={canComplete}
          onChangePaymentMethod={setPaymentMethod}
          onChangeAmountReceived={setAmountReceived}
          onChangeReference={setReference}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeItem}
          onToggleIngredient={toggleIngredient}
          onClearCart={() => setCart([])}
          onCompleteSale={handleCompleteSale}
        />
      </div>

      {/* Item detail — opened by tapping a product tile, not by "Add to
          cart". Lets staff check ingredients and set quantity first. */}
      {detailItem && (
        <PosItemDetailModal
          key={detailItem.id}
          item={detailItem}
          categoryName={data.categories.find((category) => category.id === detailItem.categoryId)?.name ?? "Uncategorized"}
          categoryColor={data.categories.find((category) => category.id === detailItem.categoryId)?.color}
          ingredients={ingredients}
          onClose={() => setDetailItem(null)}
          onAdd={addFromDetails}
        />
      )}

      {sale && (
        <ReceiptModal
          sale={sale}
          branchName={currentBranch.name}
          customisations={saleCustomisations}
          onClose={() => setSale(null)}
          onNew={() => { setSale(null); setSaleCustomisations({}); resetPayment(); setCart([]); }}
        />
      )}

      <Toast open={toast.open} onClose={() => setToast((current) => ({ ...current, open: false }))} variant={toast.variant}>
        {toast.message}
      </Toast>
    </PageContainer>
  );
}