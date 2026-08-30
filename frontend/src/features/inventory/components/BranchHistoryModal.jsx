import { Button, Modal } from "../../../components/ui";
import { InventoryHistoryList } from "./InventoryHistoryList";

export function BranchHistoryModal({ branchName, entries, inventoryMap, loading, error, onRetry, onClose }) {
  return (
    <Modal
      open
      onClose={onClose}
      title={`Inventory History${branchName ? `: ${branchName}` : ""}`}
      className="max-h-[calc(100vh-2rem)] max-w-5xl overflow-y-auto"
      footer={<Button className="w-full sm:w-auto" onClick={onClose}>Close</Button>}
    >
      <InventoryHistoryList
        entries={entries}
        inventoryMap={inventoryMap}
        showItemName
        loading={loading}
        error={error}
        emptyTitle="No recent activity recorded"
        emptyDescription="There are no recorded inventory movements for this branch yet."
        loadingLabel="Loading inventory history"
        onRetry={onRetry}
      />
    </Modal>
  );
}
