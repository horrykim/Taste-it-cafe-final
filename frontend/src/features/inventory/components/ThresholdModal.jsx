import { useState } from "react";
import { Button, FormField, Input, Modal } from "../../../components/ui";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);

export function ThresholdModal({ item, onClose, onSave }) {
  const [low, setLow] = useState(item.lowStockThreshold.toString());
  const [target, setTarget] = useState(item.targetStockLevel.toString());
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const lowValue = Number(low);
    const targetValue = Number(target);

    if (![lowValue, targetValue].every(Number.isFinite) || lowValue < 0 || targetValue < lowValue) {
      return setError("Target stock level must be at least the non-negative low-stock threshold.");
    }

    onSave({ lowStockThreshold: lowValue, targetStockLevel: targetValue });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Configure thresholds: ${item.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="threshold-form" className="bg-taste-purple hover:bg-taste-purple-strong text-white">
            Save thresholds
          </Button>
        </>
      }
    >
      <form id="threshold-form" className="space-y-4" noValidate onSubmit={submit}>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Current stock: <strong className="text-slate-900">{formatNumber(item.currentQuantity)} {item.unit}</strong>
        </p>
        <FormField label="Low-stock threshold">
          <Input type="number" min="0" step="0.01" value={low} onChange={(event) => setLow(event.target.value)} />
        </FormField>
        <FormField label="Target stock level">
          <Input type="number" min="0" step="0.01" value={target} onChange={(event) => setTarget(event.target.value)} />
        </FormField>
        <p className="text-xs leading-5 text-slate-500">
          0 is Out of Stock. From above 0 through {formatNumber(Number(low) || 0)} {item.unit} is Low Stock; quantities above that are Normal.
        </p>
      </form>
    </Modal>
  );
}
