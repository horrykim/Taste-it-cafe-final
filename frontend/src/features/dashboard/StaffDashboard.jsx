import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowRight, BellRing, ClipboardCheck, PackageSearch, ReceiptText, ShoppingCart, TrendingUp, Warehouse } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button, Card, EmptyState, ErrorState, LoadingState, Modal, StatusBadge } from "../../components/ui";
import PageContainer from "../../components/layout/PageContainer";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { getInventory } from "../../services/inventoryService";
import { getPosTransactions } from "../../services/salesService";

const money = (value) => `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

function isToday(value) {
  const date = new Date(value);
  const now = new Date();
  return date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth() && date.getDate() === now.getDate();
}

function transactionItemsLabel(items) {
  const count = items.reduce((total, item) => total + Number(item.quantity || 0), 0);
  return `${count} item${count === 1 ? "" : "s"}`;
}

function TransactionDetails({ transaction, onClose }) {
  if (!transaction) return null;

  return (
    <Modal open onClose={onClose} title={`Transaction ${transaction.transactionId}`} className="max-h-[calc(100vh-1rem)] max-w-3xl overflow-y-auto" footer={<Button variant="outline" onClick={onClose}>Close details</Button>}>
      <div className="space-y-5">
        <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p><span className="text-slate-500">Date:</span> {dateFormat.format(new Date(transaction.createdAt))}</p>
          <p><span className="text-slate-500">Cashier:</span> {transaction.cashierName}</p>
          <p><span className="text-slate-500">Payment:</span> {transaction.paymentMethod === "GCASH" ? "GCash / E-wallet" : "Cash"}</p>
          <p><span className="text-slate-500">Status:</span> <StatusBadge status={transaction.status === "COMPLETED" ? "completed" : "pending"} label={transaction.status === "COMPLETED" ? "Completed" : transaction.status} /></p>
          {transaction.paymentReference && <p><span className="text-slate-500">Reference:</span> {transaction.paymentReference}</p>}
        </div>

        <div className="overflow-hidden rounded-xl border border-taste-border">
          <div className="grid grid-cols-4 gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Item</span>
            <span>Qty</span>
            <span>Unit price</span>
            <span className="text-right">Subtotal</span>
          </div>
          {transaction.items.map((item) => (
            <div key={`${transaction.id}-${item.menuItemId}`} className="grid grid-cols-4 gap-3 border-t border-taste-border px-4 py-3 text-sm text-slate-700">
              <span className="font-medium text-slate-900">{item.name}</span>
              <span>{item.quantity}</span>
              <span>{money(item.unitPrice)}</span>
              <span className="text-right">{money(item.lineTotal)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-taste-border pt-4 text-right text-sm text-slate-600">
          <p>Subtotal: {money(transaction.subtotal)}</p>
          <p className="text-lg font-bold text-slate-900">Total: {money(transaction.total)}</p>
        </div>
      </div>
    </Modal>
  );
}

export default function StaffDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    let isCurrent = true;

    const load = async () => {
      if (!currentBranch?.id || !currentUser) return;

      setLoading(true);
      try {
        const [inventoryData, transactionData] = await Promise.all([
          getInventory(currentBranch.id),
          getPosTransactions(currentBranch.id, currentUser),
        ]);

        if (!isCurrent) return;
        setInventory(inventoryData);
        setTransactions(transactionData);
        setError("");
      } catch (loadError) {
        if (isCurrent) setError(loadError.message || "Staff dashboard data is unavailable.");
      } finally {
        if (isCurrent) setLoading(false);
      }
    };

    load();
    return () => { isCurrent = false; };
  }, [currentBranch?.id, currentUser]);

  const todaysTransactions = useMemo(
    () => transactions.filter((transaction) => transaction.status === "COMPLETED" && isToday(transaction.createdAt)),
    [transactions]
  );

  const todaysSales = useMemo(
    () => todaysTransactions.reduce((sum, transaction) => sum + Number(transaction.total || 0), 0),
    [todaysTransactions]
  );

  const alertItems = useMemo(
    () => inventory.filter((item) => item.active && item.status !== "normal"),
    [inventory]
  );

  const lowStockCount = alertItems.filter((item) => item.status === "low-stock").length;
  const outOfStockCount = alertItems.filter((item) => item.status === "out-of-stock").length;

  const notifications = useMemo(() => {
    const items = [];

    alertItems.forEach((item) => {
      if (item.status === "out-of-stock") {
        items.push(`${item.name} is out of stock.`);
      }
      if (item.status === "low-stock") {
        items.push(`${item.name} is below the configured low-stock threshold.`);
      }
    });

    return items.slice(0, 5);
  }, [alertItems]);

  if (loading) {
    return (
      <PageContainer>
        <LoadingState label="Loading dashboard" />
      </PageContainer>
    );
  }

  if (error || !currentBranch || !currentUser) {
    return (
      <PageContainer>
        <ErrorState title="Dashboard unavailable" description={error || "Select a branch to continue."} />
      </PageContainer>
    );
  }

  const quickActions = [
    { label: "View Inventory", icon: PackageSearch, action: () => navigate("/app/inventory") },
    { label: "Reconciliation", icon: ClipboardCheck, action: () => navigate("/app/reconciliation") },
    { label: "My Sales", icon: ReceiptText, action: () => navigate("/app/sales") },
  ];

  return (
    <PageContainer className="pb-12">
      <div className="space-y-6">
        <header className="rounded-3xl border border-taste-border bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Branch operations</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.06em] text-slate-900 sm:text-4xl">Staff Dashboard</h1>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-taste-border bg-slate-50 px-3 py-1.5 text-sm font-medium text-slate-700">
              <Warehouse size={16} className="text-taste-purple" />
              {currentBranch.name}
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500 sm:text-base">Daily activity and branch operations at a glance.</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Today&apos;s Sales</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{money(todaysSales)}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">Today&apos;s completed sales</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d9f3ef] text-[#179a8d]">
                <TrendingUp size={20} />
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Today&apos;s Transactions</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{todaysTransactions.length}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">Completed transactions</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f6dfe8] text-[#d54085]">
                <ReceiptText size={20} />
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Low Stock</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{lowStockCount}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">Ingredients need attention</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <AlertTriangle size={20} />
              </span>
            </div>
          </Card>

          <Card className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-500">Out of Stock</p>
                <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{outOfStockCount}</p>
                <p className="mt-2 text-xs font-medium text-slate-500">Ingredients unavailable</p>
              </div>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <AlertTriangle size={20} />
              </span>
            </div>
          </Card>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.7fr_minmax(290px,0.9fr)]">
          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Quick Start</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Ready to take your next order?</h2>
                </div>
                <span className="hidden h-12 w-12 items-center justify-center rounded-2xl bg-[#d9f3ef] text-[#179a8d] sm:flex">
                  <ShoppingCart size={22} />
                </span>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button size="lg" className="min-w-[180px]" onClick={() => navigate("/app/pos")}>
                  <ShoppingCart size={18} />
                  Start New Sale
                </Button>
                {quickActions.map(({ label, icon: Icon, action }) => (
                  <Button key={label} variant="outline" className="min-w-[140px]" onClick={action}>
                    <Icon size={16} />
                    {label}
                  </Button>
                ))}
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Today&apos;s Activity</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Operational summary</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <BellRing size={18} />
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-taste-border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Transactions</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{todaysTransactions.length}</p>
                </div>
                <div className="rounded-xl border border-taste-border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Sales</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">{money(todaysSales)}</p>
                </div>
                <div className="rounded-xl border border-taste-border bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">Items Sold</p>
                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {todaysTransactions.reduce((sum, transaction) => sum + transaction.items.reduce((itemTotal, item) => itemTotal + Number(item.quantity || 0), 0), 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Recent Transactions</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">My latest sales</h2>
                </div>
                <Button variant="ghost" onClick={() => navigate("/app/sales")}>
                  View all
                  <ArrowRight size={16} />
                </Button>
              </div>

              {todaysTransactions.length ? (
                <div className="mt-5 space-y-3">
                  {todaysTransactions.slice(0, 5).map((transaction) => (
                    <button
                      key={transaction.id}
                      type="button"
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-taste-border bg-slate-50 p-4 text-left transition hover:border-taste-teal/80 hover:bg-white"
                      onClick={() => setSelectedTransaction(transaction)}
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{transaction.transactionId}</p>
                        <p className="mt-1 text-xs text-slate-500">{dateFormat.format(new Date(transaction.createdAt))}</p>
                        <p className="mt-2 text-sm text-slate-600">{transactionItemsLabel(transaction.items)}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{money(transaction.total)}</p>
                        <p className="mt-1 text-xs text-slate-500">{transaction.paymentMethod === "GCASH" ? "GCash" : "Cash"}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState title="No transactions yet today." description="Complete your first POS sale to see it here." />
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Inventory Alerts</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Operational stock checks</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                  <AlertTriangle size={18} />
                </span>
              </div>

              {alertItems.length ? (
                <div className="mt-5 space-y-3">
                  {alertItems.map((item) => (
                    <div key={item.id} className="rounded-xl border border-taste-border bg-slate-50 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{item.name}</p>
                          <p className="mt-1 text-sm text-slate-500">{item.currentQuantity} {item.unit}</p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="mt-3 text-xs text-slate-500">
                        {item.status === "out-of-stock" ? "Current quantity: 0" : `Low threshold: ${item.lowStockThreshold} ${item.unit}`}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5">
                  <EmptyState title="All inventory levels are currently within normal range." />
                </div>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Reconciliation</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Inventory Reconciliation</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d9f3ef] text-[#179a8d]">
                  <ClipboardCheck size={18} />
                </span>
              </div>

              <p className="mt-4 text-sm leading-6 text-slate-600">Record a physical stock count and resolve discrepancies.</p>
              <Button className="mt-5 w-full" variant="outline" onClick={() => navigate("/app/reconciliation")}>
                Start Reconciliation
              </Button>
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Operations</p>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">Important alerts</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                  <BellRing size={18} />
                </span>
              </div>

              {notifications.length ? (
                <ul className="mt-5 space-y-3">
                  {notifications.map((notification) => (
                    <li key={notification} className="rounded-xl border border-taste-border bg-slate-50 p-3 text-sm leading-6 text-slate-700">
                      {notification}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyState title="You&apos;re all caught up." description="No operational alerts at the moment." />
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      <TransactionDetails transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} />
    </PageContainer>
  );
}
