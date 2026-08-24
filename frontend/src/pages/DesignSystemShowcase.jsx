import { useState } from "react";
import { Package, PhilippinePeso, TriangleAlert } from "lucide-react";
import {
  Alert, Badge, Button, Card, Checkbox, ConfirmDialog, ContentCard, EmptyState,
  ErrorState, FormField, Input, LoadingState, Modal, Radio,
  SearchInput, Select, StatCard, StatusBadge, Table, TableBody,
  TableCell, TableHeader, TableRow, Textarea, Toast, Toggle,
} from "../components/ui";
import { ContentSection, PageHeader, ResponsiveGrid, SectionHeader } from "../components/layout/PageHeader";
import PageContainer from "../components/layout/PageContainer";

function DesignSystemShowcase() {
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);

  return (
    <PageContainer className="pb-12">
      <div className="space-y-8">
        <PageHeader title="Design system" description="Development-only reference for reusable Taste It interface primitives." meta={<Badge variant="purple">Internal</Badge>} />
        <ContentSection>
          <SectionHeader title="Actions" description="Clear hierarchy for primary, supporting, and destructive actions." />
          <Card className="flex flex-wrap gap-3 p-5"><Button>Save changes</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="subtle">Subtle</Button><Button variant="danger">Delete</Button><Button loading>Saving</Button></Card>
        </ContentSection>
        <ContentSection>
          <SectionHeader title="Cards and status" />
          <ResponsiveGrid><StatCard label="Today's sales" value="₱0.00" icon={PhilippinePeso} trend="Updates from completed sales" /><StatCard label="Inventory items" value="0" icon={Package} trend="Branch-specific data" /><StatCard label="Low stock" value="0" icon={TriangleAlert} trend="Requires attention" /><ContentCard><p className="text-sm font-medium text-slate-500">Status badges</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge status="normal" /><StatusBadge status="low-stock" /><StatusBadge status="out-of-stock" /><StatusBadge status="active" /></div></ContentCard></ResponsiveGrid>
        </ContentSection>
        <ContentSection>
          <SectionHeader title="Forms" description="Shared controls with accessible labels, focus rings, and disabled/error states." />
          <Card className="grid gap-5 p-5 md:grid-cols-2"><FormField label="Item name" required hint="Example field helper text."><Input placeholder="Iced latte" /></FormField><FormField label="Category"><Select defaultValue=""><option value="" disabled>Select a category</option><option>Drinks</option><option>Meals</option></Select></FormField><FormField label="Search"><SearchInput placeholder="Search records" /></FormField><FormField label="Notes"><Textarea placeholder="Add an optional note" /></FormField><div className="flex flex-wrap items-center gap-5"><Checkbox label="Include inactive records" /><Radio label="Daily" name="frequency" defaultChecked /><Radio label="Weekly" name="frequency" /><Toggle label="Available" checked onChange={() => {}} /></div></Card>
        </ContentSection>
        <ContentSection>
          <SectionHeader title="Table" description="A responsive container preserves data alignment on small screens." />
          <Table><TableHeader><TableRow><TableCell as="th">Ingredient</TableCell><TableCell as="th">Stock</TableCell><TableCell as="th">Status</TableCell></TableRow></TableHeader><TableBody><TableRow><TableCell className="font-medium text-slate-900">Coffee beans</TableCell><TableCell>1.5 kg</TableCell><TableCell><StatusBadge status="normal" /></TableCell></TableRow><TableRow><TableCell className="font-medium text-slate-900">Milk</TableCell><TableCell>0.5 L</TableCell><TableCell><StatusBadge status="low-stock" /></TableCell></TableRow></TableBody></Table>
        </ContentSection>
        <ContentSection>
          <SectionHeader title="Feedback and overlays" />
          <div className="grid gap-4 lg:grid-cols-2"><Alert variant="info" title="Branch context">The selected branch is visible in the application header.</Alert><Alert variant="warning" title="Attention">Low-stock states use labels and icons, not color alone.</Alert><EmptyState title="No records yet" description="Reusable empty state for future data-driven screens." /><ErrorState description="Reusable recovery state for service failures." /></div>
          <div className="flex flex-wrap gap-3"><Button variant="outline" onClick={() => setModalOpen(true)}>Open modal</Button><Button variant="outline" onClick={() => setConfirmOpen(true)}>Open confirmation</Button><Button variant="outline" onClick={() => setToastVisible(true)}>Show feedback</Button></div>
          <LoadingState label="Loading component preview" />
        </ContentSection>
      </div>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Example modal" footer={<Button onClick={() => setModalOpen(false)}>Done</Button>}><p className="text-sm leading-6 text-slate-600">Responsive overlay structure for future approved workflows.</p></Modal>
      <ConfirmDialog open={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={() => setConfirmOpen(false)} title="Example confirmation" description="This demonstrates the reusable confirmation pattern only." confirmLabel="Confirm" />
      <Toast open={toastVisible} onClose={() => setToastVisible(false)} variant="success">A reusable feedback treatment.</Toast>
    </PageContainer>
  );
}

export default DesignSystemShowcase;
