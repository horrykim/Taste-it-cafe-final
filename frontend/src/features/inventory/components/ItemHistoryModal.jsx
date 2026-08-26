import { useEffect, useState } from "react";
import { useBranch } from "../../../context/BranchContext";
import { Button, EmptyState, LoadingState, Modal } from "../../../components/ui";
import { getInventoryHistory } from "../../../services/mock/mockInventoryService";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

export function ItemHistoryModal({ item, onClose }) {
  const { currentBranch } = useBranch();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    let active = true;
    getInventoryHistory(currentBranch.id, item.id).then((data) => {
      if (active) {
        setHistory(data);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [currentBranch.id, item.id]);

  return (
    <Modal
      open
      onClose={onClose}
      title={`Inventory History: ${item.name}`}
      footer={<Button className="w-full sm:w-auto" onClick={onClose}>Close</Button>}
    >
      {loading ? (
        <div className="flex h-32 items-center justify-center">
          <LoadingState />
        </div>
      ) : history.length === 0 ? (
        <EmptyState title="No history found" description="There are no recorded changes for this item." />
      ) : (
        <div className="space-y-4">
          {history.map((entry) => (
            <div key={entry.id} className="flex gap-4 rounded-xl border border-taste-border bg-slate-50 p-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${
                      entry.change.startsWith("+")
                        ? "text-emerald-600"
                        : entry.change.startsWith("-")
                        ? "text-rose-600"
                        : "text-slate-900"
                    }`}
                  >
                    {entry.change}
                  </span>
                  <span className="text-sm font-medium text-slate-500">• {entry.type}</span>
                </div>
                <div className="mt-1 text-sm text-slate-500">
                  {entry.user?.name || entry.user} • {dateFormat.format(new Date(entry.timestamp))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
