import { useEffect, useMemo, useState } from "react";
import { ReceiptText, ShoppingBag, TrendingUp, Users } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useBranch } from "../../context/BranchContext";
import { Button, ContentCard, EmptyState, ErrorState, LoadingState, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow, FilterMenu } from "../../components/ui";
import { FilterBar, ResponsiveGrid, SectionHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { getPosTransactions } from "../../services/salesService";
import TransactionDetailsDrawer from "./TransactionDetailsDrawer";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const numberFormat = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value) => `₱${numberFormat.format(value)}`;
const paymentLabel = (method) => method === "GCASH" ? "GCash" : method === "CASH" ? "Cash" : method;

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

function SummaryCard({ label, value, icon: Icon, bg, text, iconColor }) {
  return (
    <div className={`w-full rounded-2xl border p-4 shadow-sm ${bg}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</p>
          <p className={`mt-1.5 text-3xl font-extrabold tabular-nums ${text}`}>{value}</p>
        </div>
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${iconColor}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function Status({ value }) {
  return <StatusBadge status={value === "COMPLETED" ? "completed" : "pending"} label={value === "COMPLETED" ? "Completed" : value} />;
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

  const cashiers = useMemo(() => {
    const map = new Map();
    transactions.forEach(t => {
      if (!map.has(t.cashierId)) {
         map.set(t.cashierId, { name: t.cashierName, role: t.cashierRole === "OWNER" ? "Owner / Manager" : "Staff" });
      }
    });
    return Array.from(map.entries()).map(([id, info]) => ({ value: id, label: info.name, subtitle: info.role }));
  }, [transactions]);

  const filtered = useMemo(() => transactions.filter((transaction) => {
    const term = search.toLowerCase().trim();
    const searchable = `${transaction.transactionId} ${transaction.cashierName} ${transaction.items.map((item) => item.name).join(" ")}`.toLowerCase();
    return (!term || searchable.includes(term)) && matchesDate(transaction.createdAt, date) && (payment === "ALL" || transaction.paymentMethod === payment) && (status === "ALL" || transaction.status === status) && (cashier === "ALL" || transaction.cashierId === cashier);
  }), [transactions, search, date, payment, status, cashier]);

  const summary = useMemo(() => { 
    const completed = transactions.filter((transaction) => transaction.status === "COMPLETED"); 
    const total = completed.reduce((sum, transaction) => sum + transaction.total, 0); 
    return { total, count: transactions.length, average: completed.length ? total / completed.length : 0, completed: completed.length }; 
  }, [transactions]);
  
  const hasFilters = search || date !== "ALL" || payment !== "ALL" || status !== "ALL" || cashier !== "ALL";
  const clearFilters = () => { setSearch(""); setDate("ALL"); setPayment("ALL"); setStatus("ALL"); setCashier("ALL"); };

  if (loading || loadedBranch !== currentBranch?.id) return <PageContainer><LoadingState label="Loading sales" /></PageContainer>;
  if (error || !currentBranch) return <PageContainer><ErrorState title="Sales unavailable" description={error || "Select a branch to continue."} /></PageContainer>;

  return (
    <PageContainer>
      <ResponsiveGrid className="mt-7">
        <SummaryCard label="Total Sales" value={money(summary.total)} icon={TrendingUp} bg="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-100" text="text-teal-900" iconColor="bg-white text-teal-600 shadow-sm" />
        <SummaryCard label="Transactions" value={summary.count} icon={ReceiptText} bg="bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200" text="text-slate-900" iconColor="bg-white text-slate-500 shadow-sm" />
        <SummaryCard label="Average Transaction" value={money(summary.average)} icon={ShoppingBag} bg="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100" text="text-indigo-900" iconColor="bg-white text-indigo-600 shadow-sm" />
        <SummaryCard label="Completed Transactions" value={summary.completed} icon={Users} bg="bg-gradient-to-br from-purple-50 to-fuchsia-50 border-purple-100" text="text-purple-900" iconColor="bg-white text-purple-600 shadow-sm" />
      </ResponsiveGrid>
      
      <FilterBar className="mt-7 flex flex-wrap gap-3 items-center justify-between bg-white p-3 rounded-2xl border border-taste-border shadow-sm">
        <div className="flex flex-wrap gap-3 flex-1 w-full xl:w-auto items-center">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <input 
              value={search} 
              onChange={(event) => setSearch(event.target.value)} 
              placeholder="Search transaction, cashier..." 
              aria-label="Search transactions" 
              className="w-full h-10 rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none transition-colors focus:border-taste-purple focus:ring-1 focus:ring-taste-purple focus:bg-white placeholder:text-slate-400"
            />
            <svg className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>

          <FilterMenu 
            label="Date"
            value={date}
            options={[
              { value: "ALL", label: "All Dates" },
              { value: "TODAY", label: "Today" },
              { value: "YESTERDAY", label: "Yesterday" },
              { value: "WEEK", label: "This Week" },
              { value: "MONTH", label: "This Month" }
            ]}
            onChange={setDate}
          />

          <FilterMenu 
            label="Payment Method"
            value={payment}
            options={[
              { value: "ALL", label: "All Payment Methods" },
              { value: "CASH", label: "Cash" },
              { value: "GCASH", label: "GCash" }
            ]}
            onChange={setPayment}
          />

          <FilterMenu 
            label="Status"
            value={status}
            options={[
              { value: "ALL", label: "All Statuses" },
              { value: "COMPLETED", label: "Completed" }
            ]}
            onChange={setStatus}
          />

          {currentUser.role === "OWNER" && (
            <FilterMenu 
              label="Cashier"
              value={cashier}
              options={[
                { value: "ALL", label: "All Cashiers" },
                ...cashiers
              ]}
              onChange={setCashier}
            />
          )}
        </div>

        {hasFilters && <Button variant="ghost" className="h-10 text-slate-500 hover:text-slate-800 shrink-0" onClick={clearFilters}>Clear Filters</Button>}
      </FilterBar>
      
      <ContentCard className="mt-7">
        <SectionHeader title="Transactions" description={`${filtered.length} transaction${filtered.length === 1 ? "" : "s"} for ${currentBranch.name}.`} />
        
        {filtered.length > 0 ? (
          <div className="mt-5 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell as="th" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Transaction ID</TableCell>
                  <TableCell as="th" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Date & Time</TableCell>
                  <TableCell as="th" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Cashier</TableCell>
                  <TableCell as="th" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Items</TableCell>
                  <TableCell as="th" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment</TableCell>
                  <TableCell as="th" className="text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Total</TableCell>
                  <TableCell as="th" className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((transaction) => (
                  <TableRow 
                    key={transaction.id} 
                    className="cursor-pointer hover:bg-slate-50/70 transition-colors group"
                    onClick={() => setActiveTransaction(transaction)}
                  >
                    <TableCell className="font-bold text-taste-purple group-hover:text-taste-purple-strong transition-colors">{transaction.transactionId}</TableCell>
                    <TableCell className="text-slate-500 font-medium whitespace-nowrap">{dateFormat.format(new Date(transaction.createdAt))}</TableCell>
                    <TableCell className="text-slate-900 font-medium">{transaction.cashierName}</TableCell>
                    <TableCell className="text-slate-600">{transactionItemsLabel(transaction.items)}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-600 border border-slate-200 shadow-sm">
                        {paymentLabel(transaction.paymentMethod)}
                      </span>
                    </TableCell>
                    <TableCell className="font-extrabold text-slate-900 text-right">{money(transaction.total)}</TableCell>
                    <TableCell><Status value={transaction.status} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="mt-5">
            <EmptyState 
              title="No transactions found" 
              description={hasFilters ? "No sales transactions match the current filters." : "Completed POS transactions will appear here."} 
              action={hasFilters ? <Button variant="outline" onClick={clearFilters}>Clear Filters</Button> : undefined} 
            />
          </div>
        )}
      </ContentCard>

      <TransactionDetailsDrawer transaction={activeTransaction} branchName={currentBranch.name} onClose={() => setActiveTransaction(null)} />
    </PageContainer>
  );
}
