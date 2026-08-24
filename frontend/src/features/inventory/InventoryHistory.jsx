import { useEffect, useState } from "react";
import { History, PackageSearch } from "lucide-react";
import { useBranch } from "../../context/BranchContext";
import { Badge, ContentCard, EmptyState, ErrorState, LoadingState, StatusBadge, Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui";
import { PageHeader, SectionHeader } from "../../components/layout/PageHeader";
import PageContainer from "../../components/layout/PageContainer";
import { getInventory } from "../../services/mock/mockInventoryService";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const numberFormat = new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 });

export default function InventoryHistory() {
  const { currentBranch } = useBranch();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getInventory(currentBranch?.id)
      .then((inventory) => { if (active) { setItems(inventory.sort((left, right) => new Date(right.lastUpdated) - new Date(left.lastUpdated))); setError(""); } })
      .catch((loadError) => { if (active) setError(loadError.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [currentBranch?.id]);

  if (loading) return <PageContainer><LoadingState label="Loading inventory history" /></PageContainer>;
  if (error || !currentBranch) return <PageContainer><ErrorState title="Inventory history unavailable" description={error || "Select a branch to continue."} /></PageContainer>;

  return <PageContainer>
    <PageHeader title="Inventory History" description="Review the latest branch inventory changes and stock records." meta={<Badge variant="purple">{currentBranch.name}</Badge>} />
    <ContentCard className="mt-7">
      <SectionHeader title="Inventory audit history" description="Current mock inventory records are shown until historical adjustment events are available." />
      {items.length ? <div className="mt-5 overflow-x-auto"><Table><TableHeader><TableRow><TableCell as="th">Inventory item</TableCell><TableCell as="th">Action</TableCell><TableCell as="th">Quantity</TableCell><TableCell as="th">Status</TableCell><TableCell as="th">Date and time</TableCell><TableCell as="th">Branch</TableCell></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id}><TableCell className="font-semibold text-slate-900"><span className="flex items-center gap-2"><PackageSearch size={16} className="text-taste-purple" />{item.name}</span></TableCell><TableCell>Stock record updated</TableCell><TableCell>{numberFormat.format(item.currentQuantity)} {item.unit}</TableCell><TableCell><StatusBadge status={item.status} /></TableCell><TableCell>{dateFormat.format(new Date(item.lastUpdated))}</TableCell><TableCell>{currentBranch.name}</TableCell></TableRow>)}</TableBody></Table></div> : <EmptyState icon={History} title="No inventory history yet" description="Inventory activity for this branch will appear here." />}
    </ContentCard>
  </PageContainer>;
}
