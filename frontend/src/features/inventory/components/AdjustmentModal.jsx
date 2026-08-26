import { useState } from "react";
import { Button, FormField, Input, Modal, Select } from "../../../components/ui";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);

export function AdjustmentModal({ item, onClose, onSave }) {
  const [type, setType] = useState("ADD");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("New delivery");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const quantity = Number(amount);
    
    if (!Number.isFinite(quantity) || quantity < 0) {
      return setError("Enter a quantity of zero or greater.");
    }
    
    if (type === "REMOVE" && quantity > item.currentQuantity) {
      return setError("You cannot remove more stock than is currently available.");
    }
    
    if (!reason.trim()) {
      return setError("Enter an adjustment reason.");
    }
    
    onSave({ type, amount: quantity, reason: reason.trim() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust ${item.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="stock-adjustment-form" className="bg-taste-purple hover:bg-taste-purple-strong text-white">
            Update stock
          </Button>
        </>
      }
    >
      <form id="stock-adjustment-form" className="space-y-4" noValidate onSubmit={submit}>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          Current stock: <strong className="text-slate-900">{formatNumber(item.currentQuantity)} {item.unit}</strong>
        </p>
        <FormField label="Adjustment type">
          <Select value={type} onChange={(event) => setType(event.target.value)}>
            <option value="ADD">Add stock</option>
            <option value="REMOVE">Remove stock</option>
            <option value="SET">Set quantity</option>
          </Select>
        </FormField>
        <FormField label="Quantity" required>
          <Input type="number" min="0" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
        </FormField>
        <FormField label="Reason" required>
          <Select value={reason} onChange={(event) => setReason(event.target.value)}>
            <option>New delivery</option>
            <option>Damaged</option>
            <option>Spoiled</option>
            <option>Manual correction</option>
            <option>Other</option>
          </Select>
        </FormField>
      </form>
    </Modal>
  );
}
