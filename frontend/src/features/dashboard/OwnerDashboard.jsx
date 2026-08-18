import { useEffect, useState } from "react";
import { ArrowRight, Banknote, CircleX, ClipboardList, Package, Sparkles, TriangleAlert } from "lucide-react";
import { Link } from "react-router-dom";
import { ContentSection, PageHeader, ResponsiveGrid, SectionHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { Badge, Card, EmptyState, ErrorState, LoadingState, StatCard, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui";
import { useBranch } from "../../context/BranchContext";
import { getMockDashboardData } from "../../services/mock/mockDashboardService";
import SalesTrendChart from "./components/SalesTrendChart";

const formatCurrency = (value) => `₱${value.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

function OwnerDashboard() {
  const { currentBranch } = useBranch();
  const [dashboard, setDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    getMockDashboardData(currentBranch?.id)
      .then((data) => { if (isCurrent) { setDashboard(data); setError(""); } })
      .catch((loadError) => { if (isCurrent) setError(loadError.message); })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [currentBranch?.id]);

  if (isLoading) return <PageContainer><LoadingState label="Loading branch dashboard" /></PageContainer>;
  if (error || !dashboard) return <PageContainer><ErrorState title="Dashboard unavailable" description={error} /></PageContainer>;

  const { summary, recentTransactions, inventoryAlerts } = dashboard;

  return (
    <PageContainer>
      <PageHeader
        title="Dashboard"
        meta={<Badge variant="purple">{currentBranch.name}</Badge>}
        description={`A focused operating view of today's activity at the ${currentBranch.name} branch.`}
        actions={<Link to="/app/reports/ai" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-taste-purple px-4 text-sm font-semibold text-white transition-colors hover:bg-taste-purple-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple"><Sparkles size={16} />AI weekly report</Link>}
      />

      <ContentSection className="mt-7">
        <ResponsiveGrid>
          <StatCard label="Today's sales" value={formatCurrency(summary.todaysSales)} icon={Banknote} trend="Completed sales today" />
          <StatCard label="Today's transactions" value={summary.todaysTransactions} icon={ClipboardList} trend="Completed transactions today" />
          <StatCard label="Low stock items" value={summary.lowStockItems} icon={TriangleAlert} trend="Need attention soon" className="border-amber-200" />
          <StatCard label="Out of stock items" value={summary.outOfStockItems} icon={CircleX} trend="Affecting availability" className="border-rose-200" />
        </ResponsiveGrid>
      </ContentSection>

      <ContentSection className="mt-7">
        <SalesTrendChart sales={dashboard.sales} />
      </ContentSection>

      <div className="mt-7 grid gap-7 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,1fr)]">
        <ContentSection>
          <SectionHeader title="Recent transactions" description="A preview of the latest completed sales." actions={<Link to="/app/sales" className="inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-800 hover:text-fuchsia-950">View all <ArrowRight size={15} /></Link>} />
          {recentTransactions.length ? (
            <Table>
              <TableHeader><TableRow><TableCell as="th">Transaction</TableCell><TableCell as="th">Staff</TableCell><TableCell as="th">Items</TableCell><TableCell as="th">Payment</TableCell><TableCell as="th" className="text-right">Total</TableCell></TableRow></TableHeader>
              <TableBody>{recentTransactions.map((transaction) => <TableRow key={transaction.id}><TableCell><p className="font-semibold text-slate-900">{transaction.id}</p><p className="mt-1 text-xs text-slate-500">{transaction.time}</p></TableCell><TableCell>{transaction.staffName}</TableCell><TableCell>{transaction.items}</TableCell><TableCell><Badge variant="neutral">{transaction.paymentMethod}</Badge></TableCell><TableCell className="text-right font-semibold text-slate-900">{formatCurrency(transaction.total)}</TableCell></TableRow>)}</TableBody>
            </Table>
          ) : <EmptyState title="No recent transactions" description="Completed sales for this branch will appear here." />}
        </ContentSection>

        <ContentSection>
          <SectionHeader title="Inventory alerts" description="Items that need operational attention." actions={<Link to="/app/inventory" className="inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-800 hover:text-fuchsia-950">Inventory <ArrowRight size={15} /></Link>} />
          {inventoryAlerts.length ? <Card className="divide-y divide-taste-border"><div className="flex items-center justify-between gap-3 p-4"><span className="flex items-center gap-2 text-sm font-semibold text-slate-900"><Package size={17} className="text-taste-purple" />Stock status</span><span className="text-xs text-slate-500">{inventoryAlerts.length} alerts</span></div>{inventoryAlerts.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 p-4"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-900">{item.name}</p><p className="mt-1 text-xs text-slate-500">{item.category} · {item.stock} {item.unit}</p></div><StatusBadge status={item.status} /></div>)}</Card> : <EmptyState title="Inventory is on track" description="There are no low-stock or out-of-stock items for this branch." />}
        </ContentSection>
      </div>

      <Card className="mt-7 flex flex-col gap-4 border-taste-purple/25 bg-taste-purple-soft/40 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div><div className="flex items-center gap-2"><Sparkles size={18} className="text-fuchsia-800" /><h2 className="text-base font-semibold text-slate-900">AI weekly business report</h2></div><p className="mt-1 text-sm text-slate-600">Review weekly sales, inventory status, and supported business insights.</p></div>
        <Link to="/app/reports/ai" className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-taste-purple px-4 text-sm font-semibold text-white transition-colors hover:bg-taste-purple-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple">Open report <ArrowRight size={16} /></Link>
      </Card>
    </PageContainer>
  );
}

export default OwnerDashboard;