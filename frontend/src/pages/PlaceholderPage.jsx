import { Construction } from "lucide-react";
import PageContainer from "../components/layout/PageContainer";
import { useAuth } from "../context/AuthContext";
import { ContentCard } from "../components/ui";
import { PageHeader } from "../components/layout/PageHeader";

function PlaceholderPage({ title, description, staffCapabilities }) {
  const { currentUser } = useAuth();
  const capabilities = currentUser.role === "STAFF" ? staffCapabilities : null;
  return (
    <PageContainer>
      <ContentCard className="sm:p-8">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-taste-teal/25 text-taste-text"><Construction size={22} /></div>
        <PageHeader className="mt-6" title={title} description={description} />
        {capabilities && <p className="mt-4 max-w-xl rounded-xl bg-taste-teal/15 px-4 py-3 text-sm leading-6 text-taste-text">{capabilities}</p>}
        <p className="mt-6 text-sm text-taste-muted">This route is ready for its approved feature implementation.</p>
      </ContentCard>
    </PageContainer>
  );
}

export default PlaceholderPage;
