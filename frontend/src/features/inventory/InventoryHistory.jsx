import { useEffect, useMemo, useState } from "react";
import { ChevronRight, ClipboardCheck, History, PackageSearch, TriangleAlert, Search, X } from "lucide-react";
import { useBranch } from "../../context/BranchContext";
import { Badge, Button, EmptyState, ErrorState, Input, LoadingState, StatCard, Table, TableBody, TableCell, TableHeader, TableRow, FilterMenu } from "../../components/ui";
import PageContainer from "../../components/layout/PageContainer";
import { ResponsiveGrid } from "../../components/layout/PageHeader";
import { getInventory, getAllBranchHistory } from "../../services/mock/mockInventoryService";
import HistoryDetailsDrawer from "./HistoryDetailsDrawer";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });


export default function InventoryHistory() {
  const { currentBranch } = useBranch();
  const [history, setHistory] = useState([]);
  const [inventoryMap, setInventoryMap] = useState(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters state
  const [search, setSearch] = useState("");
  const [activityType, setActivityType] = useState("ALL");
  const [dateRange, setDateRange] = useState("ALL");
  const [performedBy, setPerformedBy] = useState("ALL");
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Drawer
  const [selectedRecord, setSelectedRecord] = useState(null);

  useEffect(() => {
    let active = true;
    if (!currentBranch?.id) return;

    Promise.all([
      getAllBranchHistory(currentBranch.id),
      getInventory(currentBranch.id)
    ])
      .then(([historyData, inventoryData]) => {
        if (!active) return;
        setHistory(historyData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
        setInventoryMap(new Map(inventoryData.map(item => [item.id, item])));
        setError("");
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [currentBranch?.id]);

  // Derived filters data
  const users = useMemo(() => {
    const userMap = new Map();
    history.forEach(record => {
      if (!userMap.has(record.user.name)) {
        userMap.set(record.user.name, record.user.role === "OWNER" ? "Owner / Manager" : "Staff");
      }
    });
    return Array.from(userMap.entries()).map(([name, role]) => ({ name, role })).sort((a, b) => a.name.localeCompare(b.name));
  }, [history]);

  // Apply filters
  const filtered = useMemo(() => {
    return history.filter(record => {
      // Search
      const term = search.trim().toLowerCase();
      const item = inventoryMap.get(record.itemId) || { name: "" };
      const matchesSearch = !term || 
        item.name.toLowerCase().includes(term) || 
        (record.reference || "").toLowerCase().includes(term) ||
        (record.reason || "").toLowerCase().includes(term) ||
        record.user.name.toLowerCase().includes(term);

      // Activity
      const matchesActivity = activityType === "ALL" || record.type === activityType;

      // Performer
      const matchesPerformer = performedBy === "ALL" || record.user.name === performedBy;

      // Date Range (simple logic for mock)
      let matchesDate = true;
      if (dateRange !== "ALL") {
        const recordDate = new Date(record.timestamp);
        const now = new Date();
        const diffTime = Math.abs(now - recordDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (dateRange === "TODAY") matchesDate = diffDays <= 1;
        else if (dateRange === "LAST_7_DAYS") matchesDate = diffDays <= 7;
        else if (dateRange === "LAST_30_DAYS") matchesDate = diffDays <= 30;
        else if (dateRange === "THIS_MONTH") {
          matchesDate = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
        }
      }

      return matchesSearch && matchesActivity && matchesPerformer && matchesDate;
    });
  }, [history, inventoryMap, search, activityType, performedBy, dateRange]);

  // Pagination logic
  const paginatedHistory = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage]);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  const summaries = useMemo(() => ({
    total: history.length,
    reconciliations: history.filter(r => r.type === "Reconciliation").length,
    adjustments: history.filter(r => r.type === "Stock Adjustment").length,
    restocks: history.filter(r => r.type === "Restock").length,
  }), [history]);

  const clearFilters = () => {
    setSearch("");
    setActivityType("ALL");
    setDateRange("ALL");
    setPerformedBy("ALL");
    setCurrentPage(1);
  };

  const hasActiveFilters = search || activityType !== "ALL" || dateRange !== "ALL" || performedBy !== "ALL";

  if (loading) return <PageContainer><LoadingState label="Loading inventory history" /></PageContainer>;
  if (error || !currentBranch) return <PageContainer><ErrorState title="Inventory history unavailable" description={error || "Select a branch to continue."} /></PageContainer>;

  return (
    <PageContainer>
      


      {/* Summary Cards */}
      <ResponsiveGrid className="mb-8" columns="four">
        <StatCard label="Total Activities" value={summaries.total} trend="All recorded activities" icon={History} className="h-full border-taste-border" />
        <StatCard label="Reconciliations" value={summaries.reconciliations} trend="Completed counts" icon={ClipboardCheck} className="h-full border-purple-200" />
        <StatCard label="Stock Adjustments" value={summaries.adjustments} trend="Manual changes" icon={TriangleAlert} className="h-full border-amber-200" />
        <StatCard label="Restocks" value={summaries.restocks} trend="Stock additions" icon={PackageSearch} className="h-full border-blue-200" />
      </ResponsiveGrid>

      {/* Filter Bar */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input 
            placeholder="Search inventory activity..." 
            className="pl-9 bg-white" 
            value={search} 
            onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} 
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <FilterMenu 
            label="Activity"
            value={activityType}
            options={[
              { value: "ALL", label: "All Activity" },
              { value: "Reconciliation", label: "Reconciliation" },
              { value: "Stock Adjustment", label: "Stock Adjustment" },
              { value: "Restock", label: "Restock" }
            ]}
            onChange={val => { setActivityType(val); setCurrentPage(1); }}
          />

          <FilterMenu 
            label="Date"
            value={dateRange}
            options={[
              { value: "ALL", label: "All Dates" },
              { value: "TODAY", label: "Today" },
              { value: "LAST_7_DAYS", label: "Last 7 Days" },
              { value: "LAST_30_DAYS", label: "Last 30 Days" },
              { value: "THIS_MONTH", label: "This Month" }
            ]}
            onChange={val => { setDateRange(val); setCurrentPage(1); }}
          />

          <FilterMenu 
            label="Performed By"
            value={performedBy}
            options={[
              { value: "ALL", label: "All Users" },
              ...users.map(u => ({ value: u.name, label: u.name, subtitle: u.role }))
            ]}
            onChange={val => { setPerformedBy(val); setCurrentPage(1); }}
          />

          {hasActiveFilters && (
            <Button variant="outline" className="h-10" onClick={clearFilters}>
              <X size={16} className="mr-2" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-taste-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto min-h-[400px]">
          {filtered.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableCell as="th">DATE & TIME</TableCell>
                  <TableCell as="th">ACTIVITY</TableCell>
                  <TableCell as="th">INGREDIENT</TableCell>
                  <TableCell as="th">CHANGE</TableCell>
                  <TableCell as="th">REASON / DESCRIPTION</TableCell>
                  <TableCell as="th">PERFORMED BY</TableCell>
                  <TableCell as="th">REFERENCE</TableCell>
                  <TableCell as="th"><span className="sr-only">Actions</span></TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedHistory.map((record) => {
                  const item = inventoryMap.get(record.itemId) || { name: record.itemId };
                  
                  // Render Activity badge
                  let badgeVariant = "neutral";
                  if (record.type === "Reconciliation") badgeVariant = "purple";
                  else if (record.type === "Stock Adjustment") badgeVariant = "warning";
                  else if (record.type === "Restock") badgeVariant = "blue";
                  
                  // Render Change
                  const changeClasses = record.variance > 0 
                    ? "text-emerald-700 bg-emerald-50" 
                    : record.variance < 0 
                      ? "text-rose-700 bg-rose-50" 
                      : "text-slate-700 bg-slate-50";

                  const arrow = record.variance > 0 ? "↑" : record.variance < 0 ? "↓" : "";

                  return (
                    <TableRow 
                      key={record.id} 
                      className="cursor-pointer transition-colors hover:bg-slate-50"
                      onClick={() => setSelectedRecord(record)}
                    >
                      <TableCell className="whitespace-nowrap">
                        <div className="text-slate-900 font-medium">
                          {dateFormat.format(new Date(record.timestamp)).split(',')[0]}
                        </div>
                        <div className="text-slate-500 text-xs">
                          {dateFormat.format(new Date(record.timestamp)).split(',')[1]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={badgeVariant} className="whitespace-nowrap">{record.type}</Badge>
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900">
                        {item.name}
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-slate-500 mb-0.5">{record.change.split('→')[0]} {record.change.includes('→') ? '→' : ''}</div>
                        <div className={`inline-flex items-center gap-1 font-medium px-2 py-0.5 rounded text-sm whitespace-nowrap ${changeClasses}`}>
                          {record.variance > 0 ? "+" : ""}{record.variance} {item.unit} {arrow}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs truncate text-slate-600">
                        {record.reason || <span className="italic text-slate-400">No reason</span>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="text-slate-900 font-medium">{record.user.name}</div>
                        <div className="text-slate-500 text-xs">{record.user.role === "OWNER" ? "Owner / Manager" : "Staff"}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap font-mono text-xs text-slate-500">
                        {record.reference || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronRight size={18} className="text-slate-400 ml-auto" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="py-20">
              <EmptyState icon={History} title="No inventory history found" description="Adjust your filters or record an inventory activity to see it here." />
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-taste-border bg-slate-50 px-5 py-3">
            <span className="text-sm text-slate-500">
              Showing <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filtered.length)}</span> of <span className="font-medium text-slate-900">{filtered.length}</span> activities
            </span>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)}>
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${currentPage === i + 1 ? "bg-taste-pink text-white" : "text-slate-600 hover:bg-slate-200"}`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)}>
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drawer */}
      <HistoryDetailsDrawer 
        record={selectedRecord} 
        inventoryMap={inventoryMap} 
        onClose={() => setSelectedRecord(null)}
        onNavigateToReconciliation={(id) => {
          // In a real app this would use useNavigate
          // For now, this is a mock action as the prompt didn't ask to overhaul routing
          console.log("Navigating to reconciliation:", id);
          alert("Navigating to reconciliation: " + id);
        }}
      />
    </PageContainer>
  );
}
