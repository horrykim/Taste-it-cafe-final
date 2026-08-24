import { useCallback, useEffect, useMemo, useState } from "react";
import { Minus, Plus, ReceiptText, ShoppingCart, Trash2, Wallet } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Badge, Button, ContentCard, EmptyState, ErrorState, Input, LoadingState, Modal, SearchInput, Select, Toast } from "../../components/ui";
import { FilterBar, PageHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { createPosTransaction, getPosCatalogData } from "../../services/mock/mockPosService";
import MenuImage from "../menu/components/MenuImage";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Receipt({ sale, branchName, onClose, onNew }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Digital receipt"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close receipt</Button>
          <Button variant="secondary" onClick={() => window.print()}><ReceiptText size={16} />Print receipt</Button>
          <Button onClick={onNew}>New transaction</Button>
        </>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Taste It Cafe</h3>
          <p className="text-slate-500">{branchName} · {sale.transactionId}</p>
          <p className="text-slate-500">{new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" }).format(new Date(sale.createdAt))}</p>
        </div>

        <p>
          Cashier: <strong>{sale.cashierName}</strong>
        </p>

        <div className="divide-y divide-taste-border border-y border-taste-border">
          {sale.items.map((item) => (
            <div key={`${item.menuItemId}-${item.name}`} className="flex justify-between gap-3 py-3">
              <span>
                {item.name} × {item.quantity}
                <small className="block text-slate-500">{money(item.unitPrice)} each</small>
              </span>
              <strong>{money(item.lineTotal)}</strong>
            </div>
          ))}
        </div>

        <div className="space-y-1 text-right">
          <p>Subtotal: {money(sale.subtotal)}</p>
          <p className="text-lg font-bold text-slate-900">Total: {money(sale.total)}</p>
        </div>

        <p>
          Payment: <strong>{sale.paymentMethod === "GCASH" ? "GCash / QR" : "Cash"}</strong>
          {sale.paymentReference && <span> · Ref: {sale.paymentReference}</span>}
        </p>
      </div>
    </Modal>
  );
}

export default function POS() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [amountReceived, setAmountReceived] = useState("");
  const [reference, setReference] = useState("");
  const [sale, setSale] = useState(null);
  const [toast, setToast] = useState({ open: false, message: "", variant: "success" });
  const branchId = currentBranch?.id;

  const notify = (message, variant = "success") => {
    setToast({ open: true, message, variant });
  };

  const refreshCatalog = useCallback(async () => {
    if (!branchId) {
      setData(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const result = await getPosCatalogData(branchId);
      setData(result);
      setError("");
      return result;
    } catch (loadError) {
      setError(loadError.message || "Unable to load the POS catalog.");
      return null;
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!isMounted) return;
      await refreshCatalog();
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [refreshCatalog]);

  const filteredItems = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();

    return data.items.filter((item) => {
      const categoryName = data.categories.find((entry) => entry.id === item.categoryId)?.name ?? "";
      const searchableText = [item.name, item.description, categoryName].join(" ").toLowerCase();
      const matchesSearch = !term || searchableText.includes(term);
      const matchesCategory = category === "ALL" || item.categoryId === category;
      return matchesSearch && matchesCategory;
    });
  }, [category, data, search]);

  const subtotal = useMemo(() => cart.reduce((sum, line) => sum + line.price * line.quantity, 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const enteredCash = Number(amountReceived || 0);
  const cashChange = paymentMethod === "CASH" ? Math.max(enteredCash - subtotal, 0) : 0;
  const insufficientCash = paymentMethod === "CASH" && subtotal > 0 && enteredCash < subtotal;
  const hasValidPayment = paymentMethod === "CASH" ? subtotal > 0 && !insufficientCash : Boolean(reference.trim());
  const canComplete = cart.length > 0 && hasValidPayment;

  const addToCart = (item) => {
    if (!item.available) {
      notify("This item is currently unavailable.", "warning");
      return;
    }

    setCart((current) => {
      const existing = current.find((line) => line.menuItemId === item.id);
      if (existing) {
        return current.map((line) => (line.menuItemId === item.id ? { ...line, quantity: line.quantity + 1 } : line));
      }

      return [...current, { menuItemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart((current) =>
      current.flatMap((line) => {
        if (line.menuItemId !== menuItemId) return [line];
        const nextQuantity = line.quantity + delta;
        return nextQuantity <= 0 ? [] : [{ ...line, quantity: nextQuantity }];
      })
    );
  };

  const removeItem = (menuItemId) => {
    setCart((current) => current.filter((line) => line.menuItemId !== menuItemId));
  };

  const resetPayment = () => {
    setPaymentMethod("CASH");
    setAmountReceived("");
    setReference("");
  };

  const handleCompleteSale = async () => {
    if (!currentBranch?.id || !currentUser || !canComplete) return;

    try {
      const result = await createPosTransaction(
        currentBranch.id,
        cart,
        {
          method: paymentMethod,
          reference: paymentMethod === "GCASH" ? reference.trim() : "",
        },
        currentUser
      );

      setSale(result);
      setCart([]);
      resetPayment();
      notify(`Sale completed successfully. Transaction #${result.transactionId}`, "success");
      await refreshCatalog();
    } catch (errorItem) {
      notify(errorItem.message || "Unable to complete the sale.", "danger");
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <LoadingState label="Loading POS catalog" />
      </PageContainer>
    );
  }

  if (error || !data || !currentBranch) {
    return (
      <PageContainer>
        <ErrorState title="POS unavailable" description={error || "Select a branch to continue."} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader
        title="Point of Sale"
        description="Create and record customer transactions."
        meta={<Badge variant="purple">{currentBranch.name}</Badge>}
      />

      <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
        <section>
          <FilterBar className="flex-col gap-3 sm:flex-row">
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search menu item"
                aria-label="Search menu items"
              />
            </div>

            <Select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter menu by category" className="sm:max-w-52">
              <option value="ALL">All categories</option>
              {data.categories.map((categoryItem) => (
                <option key={categoryItem.id} value={categoryItem.id}>{categoryItem.name}</option>
              ))}
            </Select>

            {(search || category !== "ALL") && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setCategory("ALL");
                }}
              >
                Clear filters
              </Button>
            )}
          </FilterBar>

          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredItems.map((item) => {
              const categoryName = data.categories.find((entry) => entry.id === item.categoryId)?.name ?? "Category";
              const isUnavailable = !item.available || item.status !== "ACTIVE";

              return (
                <ContentCard key={item.id} className="flex h-full flex-col overflow-hidden p-0">
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
                    <MenuImage imageUrl={item.imageUrl} alt={item.name} className="h-full w-full object-cover" />
                    <div className="absolute left-3 top-3">
                      <Badge variant={isUnavailable ? "danger" : "success"}>{isUnavailable ? "Out of stock" : "Available"}</Badge>
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <span className="inline-flex w-fit rounded-lg bg-slate-100 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-600">
                      {categoryName}
                    </span>

                    <h2 className="mt-3 text-lg font-semibold text-slate-900">{item.name}</h2>
                    <p className="mt-2 text-base font-bold text-slate-900">{money(item.price)}</p>
                    <p className="mt-2 text-sm text-slate-500">{item.description}</p>

                    <div className="mt-auto pt-4">
                      {isUnavailable ? (
                        <Button className="w-full" size="sm" variant="outline" disabled>
                          Out of stock
                        </Button>
                      ) : (
                        <Button className="w-full" size="sm" onClick={() => addToCart(item)}>
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </ContentCard>
              );
            })}
          </div>

          {!filteredItems.length && (
            <div className="mt-5">
              <EmptyState
                title="No menu items found."
                description="Try changing the search or category filter to see more products."
                action={
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSearch("");
                      setCategory("ALL");
                    }}
                  >
                    Clear filters
                  </Button>
                }
              />
            </div>
          )}
        </section>

        <ContentCard className="h-fit xl:sticky xl:top-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-800">
                <ShoppingCart size={18} />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Current transaction</h2>
                <p className="text-xs text-slate-500">{cartCount} item{cartCount === 1 ? "" : "s"}</p>
              </div>
            </div>

            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={() => setCart([])}>
                Clear
              </Button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="mt-6 flex min-h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-taste-border bg-slate-50 px-4 text-center">
              <ShoppingCart size={28} className="text-slate-400" />
              <p className="mt-3 text-base font-semibold text-slate-900">Your cart is empty.</p>
              <p className="mt-1 text-sm text-slate-500">Add an available menu item to begin.</p>
            </div>
          ) : (
            <div className="mt-5 space-y-3">
              {cart.map((line) => (
                <div key={line.menuItemId} className="rounded-2xl border border-taste-border bg-slate-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-slate-900">{line.name}</p>
                      <p className="mt-1 text-xs text-slate-500">{money(line.price)} each</p>
                    </div>

                    <button
                      type="button"
                      aria-label={`Remove ${line.name}`}
                      className="text-slate-400 transition hover:text-rose-600"
                      onClick={() => removeItem(line.menuItemId)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        aria-label={`Decrease quantity for ${line.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-taste-border bg-white text-slate-700"
                        onClick={() => updateQuantity(line.menuItemId, -1)}
                      >
                        <Minus size={16} />
                      </button>
                      <span className="min-w-6 text-center text-sm font-semibold text-slate-900">{line.quantity}</span>
                      <button
                        type="button"
                        aria-label={`Increase quantity for ${line.name}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-taste-border bg-white text-slate-700"
                        onClick={() => updateQuantity(line.menuItemId, 1)}
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-slate-500">Line total</p>
                      <p className="text-base font-bold text-slate-900">{money(line.price * line.quantity)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {cart.length > 0 && (
            <div className="mt-6 space-y-4 border-t border-taste-border pt-4">
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Subtotal</span>
                  <strong>{money(subtotal)}</strong>
                </div>
                <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                  <span>Total</span>
                  <strong>{money(subtotal)}</strong>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Payment method
                  <Select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)} className="mt-1.5 w-full" aria-label="Select payment method">
                    <option value="CASH">Cash</option>
                    <option value="GCASH">GCash / QR</option>
                  </Select>
                </label>

                {paymentMethod === "CASH" ? (
                  <>
                    <label className="block text-sm font-medium text-slate-700">
                      Amount received
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={amountReceived}
                        onChange={(event) => setAmountReceived(event.target.value)}
                        className="mt-1.5 w-full"
                        placeholder="0.00"
                        aria-label="Cash amount received"
                      />
                    </label>

                    <div className="rounded-xl border border-taste-border bg-slate-50 px-3 py-2.5 text-sm">
                      <div className="flex items-center justify-between text-slate-600">
                        <span>Change</span>
                        <strong className="text-slate-900">{money(cashChange)}</strong>
                      </div>
                    </div>

                    {insufficientCash && (
                      <p className="text-sm text-rose-600">Amount received is insufficient.</p>
                    )}
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-slate-700">
                      Reference Number
                      <Input
                        value={reference}
                        onChange={(event) => setReference(event.target.value)}
                        className="mt-1.5 w-full"
                        placeholder="e.g. 123456789"
                        aria-label="Payment reference number"
                      />
                    </label>
                    <p className="text-xs leading-5 text-slate-500">Payment is recorded only. Taste It does not process payments.</p>
                  </>
                )}

                <div className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  <Wallet size={15} />
                  <span>Payment is recorded only. Taste It does not process payments.</span>
                </div>
              </div>

              <Button className="w-full" size="lg" disabled={!canComplete} onClick={handleCompleteSale}>
                <ReceiptText size={16} />
                Complete Sale
              </Button>
            </div>
          )}
        </ContentCard>
      </div>

      {sale && (
        <Receipt
          sale={sale}
          branchName={currentBranch.name}
          onClose={() => setSale(null)}
          onNew={() => {
            setSale(null);
            resetPayment();
            setCart([]);
          }}
        />
      )}

      <Toast open={toast.open} onClose={() => setToast((current) => ({ ...current, open: false }))} variant={toast.variant}>
        {toast.message}
      </Toast>
    </PageContainer>
  );
}
