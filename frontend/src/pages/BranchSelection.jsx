import { useState } from "react";
import { ArrowRight, Check, MapPin, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge, Button, Card } from "../components/ui";
import { useAuth } from "../context/AuthContext";
import { useBranch } from "../context/BranchContext";
import { cn } from "../utils/cn";

function BranchSelection() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { branches, currentBranch, selectBranch } = useBranch();
  const [selectedBranchId, setSelectedBranchId] = useState(currentBranch?.id ?? "");
  const selectedBranch = branches.find((branch) => branch.id === selectedBranchId);

  const continueToWorkspace = () => {
    if (!selectedBranchId) return;
    selectBranch(selectedBranchId);
    navigate("/app/dashboard");
  };

  return (
    <main className="min-h-screen bg-taste-background px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-col gap-5 border-b border-taste-border pb-7 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-taste-purple">Taste It Café</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-taste-text sm:text-4xl">Choose a branch</h1><p className="mt-2 max-w-xl text-base leading-7 text-taste-muted">Select the branch workspace you want to open. You can switch later from the application header.</p></div>
          <div className="flex items-center gap-3 rounded-2xl border border-taste-border bg-white px-4 py-3 shadow-card"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-taste-purple-soft text-fuchsia-800"><UserRound size={18} /></span><div><p className="text-sm font-semibold text-slate-900">{currentUser.name}</p><p className="text-xs text-taste-muted">Owner / Manager</p></div></div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {branches.map((branch) => {
            const isSelected = selectedBranchId === branch.id;
            const isDisabled = branch.status !== "ACTIVE";
            return <Card key={branch.id} as="button" type="button" disabled={isDisabled} aria-pressed={isSelected} onClick={() => setSelectedBranchId(branch.id)} className={cn("relative p-6 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-taste-purple disabled:cursor-not-allowed disabled:opacity-50", isSelected ? "border-taste-purple ring-3 ring-taste-purple/15" : "hover:-translate-y-0.5 hover:border-taste-teal hover:shadow-md")}>
              <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl text-slate-800", isSelected ? "bg-taste-purple-soft" : "bg-taste-teal-soft")}><MapPin size={21} /></span>
              {isSelected && <span className="absolute right-5 top-5 flex h-6 w-6 items-center justify-center rounded-full bg-taste-purple text-white"><Check size={15} /></span>}
              <span className="mt-5 block text-lg font-semibold text-slate-900">{branch.name}</span>
              <span className="mt-1 block text-sm text-taste-muted">{branch.location}</span>
              <span className="mt-4 block">{isSelected ? <Badge variant="purple">Selected</Badge> : <Badge variant="success">Available</Badge>}</span>
            </Card>;
          })}
        </div>
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-taste-border bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-5"><div><p className="text-sm font-semibold text-slate-900">{selectedBranch ? `${selectedBranch.name} selected` : "Select a branch to continue"}</p><p className="mt-1 text-sm text-taste-muted">Your selected branch remains visible while you work.</p></div><Button size="lg" disabled={!selectedBranchId} onClick={continueToWorkspace}>Continue to workspace <ArrowRight size={17} /></Button></div>
      </div>
    </main>
  );
}

export default BranchSelection;
