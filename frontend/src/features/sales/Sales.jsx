import { useEffect, useMemo, useState } from "react";
import { Eye, ReceiptText, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Badge, Button, ContentCard, EmptyState, ErrorState, LoadingState, Modal, SearchInput, Select, StatCard, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui";
import { FilterBar, PageHeader, ResponsiveGrid, SectionHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { getPosTransactions } from "../../services/mock/mockPosService";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const numberFormat = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value) => `₱${numberFormat.format(value)}`;
const paymentLabel = (method) => method === "GCASH" ? "GCash / E-wallet" : method === "CASH" ? "Cash" : method;
const statusLabel = (status) => status === "COMPLETED" ? "Completed" : status;

function dateKey(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function matchesDate(value, filter) {
  if (filter === "ALL") return true;
  const now = new Date();
  const date = new Date(value);
  if (filter === "TODAY") return dateKey(date) === dateKey(now);
  if (filter === "YESTERDAY") { const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1); return dateKey(date) === dateKey(yesterday); }
  if (filter === "WEEK") { const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0); return date >= start && date <= now; }
  if (filter === "MONTH") return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  return true;
}

function transactionItemsLabel(items) {
  const count = items.reduce((total, item) => total + item.quantity, 0);
  return `${count} item${count === 1 ? "" : "s"}`;
}

function Status({ value }) {
  return <StatusBadge status={value === "COMPLETED" ? "completed" : "pending"} label={statusLabel(value)} />;
}

function TransactionDetails({ transaction, branchName, onClose }) {
  if (!transaction) return null;
  return <Modal open onClose={onClose} title={`Transaction ${transaction.transactionId}`} className="max-h-[calc(100vh-1rem)] max-w-3xl overflow-y-auto" footer={<Button variant="outline" onClick={onClose}>Close details</Button>}>
    <div className="space-y-5">
      <div className="grid gap-3 rounded-xl bg-slate-50 p-4 text-sm sm:grid-cols-2">
        <p><span className="text-slate-500">Branch:</span> {branchName}</p>
        <p><span className="text-slate-500">Date:</span> {dateFormat.format(new Date(transaction.createdAt))}</p>
        <p><span className="text-slate-500">Cashier:</span> {transaction.cashierName}</p>
        <p><span className="text-slate-500">Status:</span> <Status value={transaction.status} /></p>
        <p><span className="text-slate-500">Payment:</span> {paymentLabel(transaction.paymentMethod)}</p>
        {transaction.paymentReference && <p><span className="text-slate-500">Reference:</span> {transaction.paymentReference}</p>}
      </div>
      <Table>
        <TableHeader><TableRow><TableCell as="th">Item</TableCell><TableCell as="th">Qty</TableCell><TableCell as="th">Unit price</TableCell><TableCell as="th">Subtotal</TableCell></TableRow></TableHeader>
        <TableBody>{transaction.items.map((item) => <TableRow key={item.menuItemId}><TableCell className="font-medium text-slate-900">{item.name}</TableCell><TableCell>{item.quantity}</TableCell><TableCell>{money(item.unitPrice)}</TableCell><TableCell>{money(item.lineTotal)}</TableCell></TableRow>)}</TableBody>
      </Table>
      <div className="space-y-1 border-t border-taste-border pt-4 text-right text-sm"><p>Subtotal: {money(transaction.subtotal)}</p><p className="text-lg font-bold text-slate-900">Total: {money(transaction.total)}</p></div>
    </div>
  </Modal>;
}

function MobileTransaction({ transaction, onView }) {
  return <div className="rounded-xl border border-taste-border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-semibold text-slate-900">{transaction.transactionId}</p><p className="mt-1 text-xs text-slate-500">{dateFormat.format(new Date(transaction.createdAt))}</p></div><Status value={transaction.status} /></div><div className="mt-4 grid grid-cols-2 gap-3 text-sm"><p><span className="block text-xs text-slate-500">Cashier</span>{transaction.cashierName}</p><p><span className="block text-xs text-slate-500">Items</span>{transactionItemsLabel(transaction.items)}</p><p><span className="block text-xs text-slate-500">Payment</span>{paymentLabel(transaction.paymentMethod)}</p><p><span className="block text-xs text-slate-500">Total</span><strong>{money(transaction.total)}</strong></p></div><Button variant="outline" size="sm" className="mt-4 w-full" onClick={onView}><Eye size={16} />View transaction</Button></div>;
}

export default function Sales() {
  const { currentUser } = useAuth();
  const { currentBranch } = useBranch();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadedBranch, setLoadedBranch] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [date, setDate] = useState("ALL");
  const [payment, setPayment] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [cashier, setCashier] = useState("ALL");
  const [activeTransaction, setActiveTransaction] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      if (!currentBranch?.id || !currentUser) return;
      setLoading(true);
      try {
        const nextTransactions = await getPosTransactions(currentBranch.id, currentUser);
        if (isMounted) setTransactions(nextTransactions);
        if (isMounted) setError("");
      } catch (loadError) {
        if (isMounted) setError(loadError.message);
      } finally {
        if (isMounted) {
          setLoadedBranch(currentBranch.id);
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      isMounted = false;
    };
  }, [currentBranch?.id, currentUser]);

  const cashiers = useMemo(() => [...new Map(transactions.map((transaction) => [transaction.cashierId, transaction.cashierName])).entries()], [transactions]);
  const filtered = useMemo(() => transactions.filter((transaction) => {
    const term = search.toLowerCase().trim();
    const searchable = `${transaction.transactionId} ${transaction.cashierName} ${transaction.items.map((item) => item.name).join(" ")}`.toLowerCase();
    return (!term || searchable.includes(term)) && matchesDate(transaction.createdAt, date) && (payment === "ALL" || transaction.paymentMethod === payment) && (status === "ALL" || transaction.status === status) && (cashier === "ALL" || transaction.cashierId === cashier);
  }), [transactions, search, date, payment, status, cashier]);
  const summary = useMemo(() => { const completed = transactions.filter((transaction) => transaction.status === "COMPLETED"); const total = completed.reduce((sum, transaction) => sum + transaction.total, 0); return { total, count: transactions.length, average: completed.length ? total / completed.length : 0, completed: completed.length }; }, [transactions]);
  const hasFilters = search || date !== "ALL" || payment !== "ALL" || status !== "ALL" || cashier !== "ALL";
  const clearFilters = () => { setSearch(""); setDate("ALL"); setPayment("ALL"); setStatus("ALL"); setCashier("ALL"); };

  if (loading || loadedBranch !== currentBranch?.id) return <PageContainer><LoadingState label="Loading sales" /></PageContainer>;
  if (error || !currentBranch) return <PageContainer><ErrorState title="Sales unavailable" description={error || "Select a branch to continue."} /></PageContainer>;

  return <PageContainer><PageHeader title="Sales" description="Review completed transactions recorded through POS." meta={<Badge variant="purple">{currentBranch.name}</Badge>} /><ResponsiveGrid className="mt-7"><StatCard label="Total sales" value={money(summary.total)} icon={TrendingUp} /><StatCard label="Transactions" value={summary.count} icon={ReceiptText} /><StatCard label="Average transaction" value={money(summary.average)} icon={ShoppingBag} /><StatCard label="Completed transactions" value={summary.completed} icon={Users} /></ResponsiveGrid><FilterBar className="mt-7"><SearchInput value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search transaction, cashier, or item" aria-label="Search sales" className="sm:min-w-64 sm:max-w-sm" /><Select value={date} onChange={(event) => setDate(event.target.value)} aria-label="Filter sales by date" className="sm:max-w-44"><option value="ALL">All dates</option><option value="TODAY">Today</option><option value="YESTERDAY">Yesterday</option><option value="WEEK">This week</option><option value="MONTH">This month</option></Select><Select value={payment} onChange={(event) => setPayment(event.target.value)} aria-label="Filter sales by payment method" className="sm:max-w-48"><option value="ALL">All payment methods</option><option value="CASH">Cash</option><option value="GCASH">GCash / E-wallet</option></Select><Select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter sales by status" className="sm:max-w-40"><option value="ALL">All statuses</option><option value="COMPLETED">Completed</option></Select>{currentUser.role === "OWNER" && <Select value={cashier} onChange={(event) => setCashier(event.target.value)} aria-label="Filter sales by cashier" className="sm:max-w-44"><option value="ALL">All cashiers</option>{cashiers.map(([id, name]) => <option key={id} value={id}>{name}</option>)}</Select>}{hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}</FilterBar><ContentCard className="mt-7"><SectionHeader title="Transactions" description={`${filtered.length} transaction${filtered.length === 1 ? "" : "s"} for ${currentBranch.name}.`} />{filtered.length ? <><div className="mt-5 hidden lg:block"><Table><TableHeader><TableRow><TableCell as="th">Transaction ID</TableCell><TableCell as="th">Date / time</TableCell><TableCell as="th">Cashier</TableCell><TableCell as="th">Items</TableCell><TableCell as="th">Payment</TableCell><TableCell as="th">Total</TableCell><TableCell as="th">Status</TableCell><TableCell as="th">Action</TableCell></TableRow></TableHeader><TableBody>{filtered.map((transaction) => <TableRow key={transaction.id}><TableCell className="font-semibold text-slate-900">{transaction.transactionId}</TableCell><TableCell>{dateFormat.format(new Date(transaction.createdAt))}</TableCell><TableCell>{transaction.cashierName}</TableCell><TableCell>{transactionItemsLabel(transaction.items)}</TableCell><TableCell>{paymentLabel(transaction.paymentMethod)}</TableCell><TableCell className="font-semibold">{money(transaction.total)}</TableCell><TableCell><Status value={transaction.status} /></TableCell><TableCell><Button variant="ghost" size="sm" onClick={() => setActiveTransaction(transaction)}><Eye size={16} />View</Button></TableCell></TableRow>)}</TableBody></Table></div><div className="mt-5 grid gap-3 lg:hidden">{filtered.map((transaction) => <MobileTransaction key={transaction.id} transaction={transaction} onView={() => setActiveTransaction(transaction)} />)}</div></> : <div className="mt-5"><EmptyState title="No sales found" description={hasFilters ? "Try adjusting your search or filters." : "Completed POS transactions will appear here."} /></div>}</ContentCard><TransactionDetails transaction={activeTransaction} branchName={currentBranch.name} onClose={() => setActiveTransaction(null)} /></PageContainer>;
}
