import { useMemo, useState } from "react";
import { ArrowRight, Minus, Plus, RefreshCw } from "lucide-react";
import { Button, FormField, Input, Modal, Select } from "../../../components/ui";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);

function StockPreview({ type, current, amount, unit }) {
  const qty = Number(amount);
  const valid = Number.isFinite(qty) && qty >= 0;

  const newQty = useMemo(() => {
    if (!valid) return null;
    if (type === "ADD") return current + qty;
    if (type === "REMOVE") return Math.max(0, current - qty);
    if (type === "SET") return qty;
    return null;
  }, [type, current, qty, valid]);

  const colorClass =
    type === "ADD" ? "text-emerald-600 border-emerald-200 bg-emerald-50" :
    type === "REMOVE" ? "text-rose-600 border-rose-200 bg-rose-50" :
    "text-blue-600 border-blue-200 bg-blue-50";

  const Icon = type === "ADD" ? Plus : type === "REMOVE" ? Minus : RefreshCw;

  if (!valid || amount === "") return (
    <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-400">
      Enter a quantity to preview the change
    </div>
  );

  return (
    <div className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${colorClass}`}>
      <div className="text-center">
        <p className="text-xs font-medium opacity-70 mb-0.5">Before</p>
        <p className="text-xl font-extrabold">{formatNumber(current)}</p>
        <p className="text-xs opacity-70">{unit}</p>
      </div>
      <div className="flex flex-col items-center gap-1">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/60">
          <Icon size={16} />
        </div>
        <ArrowRight size={16} className="opacity-50" />
        <p className="text-xs font-bold">{type === "ADD" ? `+${formatNumber(qty)}` : type === "REMOVE" ? `-${formatNumber(qty)}` : `=${formatNumber(qty)}`}</p>
      </div>
      <div className="text-center">
        <p className="text-xs font-medium opacity-70 mb-0.5">After</p>
        <p className="text-xl font-extrabold">{formatNumber(newQty)}</p>
        <p className="text-xs opacity-70">{unit}</p>
      </div>
    </div>
  );
}

export function AdjustmentModal({ item, reconciliationReasons = [], onClose, onSave }) {
  const [type, setType] = useState("ADD");
  const [amount, setAmount] = useState("");
  const [reasonId, setReasonId] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [error, setError] = useState("");

  const selectedReason = reconciliationReasons.find(r => r.id === reasonId);
  const isOther = selectedReason?.reason_type === "other";

  const submit = (event) => {
    event.preventDefault();
    const quantity = Number(amount);

    if (!Number.isFinite(quantity) || quantity < 0) {
      return setError("Enter a quantity of zero or greater.");
    }

    if (type === "REMOVE" && quantity > item.currentQuantity) {
      return setError("You cannot remove more stock than is currently available.");
    }

    if (!reasonId) {
      return setError("Select an adjustment reason.");
    }

    if (isOther && !otherReason.trim()) {
      return setError("Please specify the reason.");
    }

    onSave({ type, amount: quantity, reasonId, otherReason: isOther ? otherReason.trim() : null });
  };

  const typeButtonClass = (val) =>
    `flex-1 rounded-lg py-2 text-sm font-semibold transition-all border ${
      type === val
        ? val === "ADD" ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
          : val === "REMOVE" ? "bg-rose-500 text-white border-rose-500 shadow-sm"
          : "bg-blue-500 text-white border-blue-500 shadow-sm"
        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50"
    }`;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Adjust Stock — ${item.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="stock-adjustment-form" className="bg-taste-purple hover:bg-taste-purple-strong text-white">
            Update stock
          </Button>
        </>
      }
    >
      <form id="stock-adjustment-form" className="space-y-5" noValidate onSubmit={submit}>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        {/* TYPE TOGGLE */}
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Adjustment type</p>
          <div className="flex gap-2">
            <button type="button" className={typeButtonClass("ADD")} onClick={() => setType("ADD")}>+ Add</button>
            <button type="button" className={typeButtonClass("REMOVE")} onClick={() => setType("REMOVE")}>− Remove</button>
            <button type="button" className={typeButtonClass("SET")} onClick={() => setType("SET")}>=&nbsp;Set to</button>
          </div>
        </div>

        {/* QUANTITY */}
        <FormField label="Quantity" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={amount}
            placeholder="0"
            onChange={(event) => setAmount(event.target.value)}
          />
        </FormField>

        {/* LIVE PREVIEW */}
        <StockPreview type={type} current={item.currentQuantity} amount={amount} unit={item.unit} />

        {/* REASON */}
        <FormField label="Reason" required>
          <Select value={reasonId} onChange={(event) => setReasonId(event.target.value)}>
            <option value="">Select reason</option>
            {reconciliationReasons.map((r) => (
              <option key={r.id} value={r.id}>{r.label}</option>
            ))}
          </Select>
        </FormField>

        {isOther && (
          <FormField label="Specify Reason" required>
            <Input value={otherReason} onChange={(event) => setOtherReason(event.target.value)} />
          </FormField>
        )}
      </form>
    </Modal>
  );
}
