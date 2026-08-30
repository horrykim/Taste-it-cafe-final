import { useState } from "react";
import { AlertCircle, TrendingDown, TrendingUp } from "lucide-react";
import { Button, FormField, Input, Modal } from "../../../components/ui";

const formatNumber = (value) => new Intl.NumberFormat("en-PH", { maximumFractionDigits: 2 }).format(value);

function StockBar({ current, threshold }) {
  const safe = threshold > 0 ? Math.min((current / (threshold * 3)) * 100, 100) : current > 0 ? 100 : 0;
  const color =
    current <= 0 ? "bg-rose-500" :
    current <= threshold ? "bg-amber-400" :
    "bg-emerald-500";
  return (
    <div className="mt-3">
      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${safe}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-1">
        <span>0</span>
        <span className="text-slate-500 font-medium">Threshold: {formatNumber(threshold)}</span>
      </div>
    </div>
  );
}

export function ThresholdModal({ item, onClose, onSave }) {
  const [low, setLow] = useState(item.lowStockThreshold.toString());
  const [error, setError] = useState("");

  const lowNum = Number(low) || 0;

  const submit = (event) => {
    event.preventDefault();
    const lowValue = Number(low);

    if (!Number.isFinite(lowValue) || lowValue < 0) {
      return setError("Low-stock threshold must be a non-negative number.");
    }

    onSave({ lowStockThreshold: lowValue });
  };

  const statusIcon =
    item.currentQuantity <= 0 ? { Icon: AlertCircle, color: "text-rose-500", label: "Out of Stock" } :
    item.currentQuantity <= lowNum ? { Icon: TrendingDown, color: "text-amber-500", label: "Low Stock" } :
    { Icon: TrendingUp, color: "text-emerald-500", label: "Normal" };

  const { Icon, color, label } = statusIcon;

  return (
    <Modal
      open
      onClose={onClose}
      title={`Stock Threshold — ${item.name}`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit" form="threshold-form" className="bg-taste-purple hover:bg-taste-purple-strong text-white">
            Save threshold
          </Button>
        </>
      }
    >
      <form id="threshold-form" className="space-y-5" noValidate onSubmit={submit}>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}

        {/* CURRENT STOCK CARD */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Current Stock</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-extrabold text-slate-900">{formatNumber(item.currentQuantity)}</span>
                <span className="text-sm font-semibold text-slate-500">{item.unit}</span>
              </div>
            </div>
            <div className={`flex flex-col items-center gap-1 ${color}`}>
              <Icon size={22} />
              <span className="text-xs font-bold">{label}</span>
            </div>
          </div>
          <StockBar current={item.currentQuantity} threshold={lowNum} />
        </div>

        {/* THRESHOLD INPUT */}
        <FormField label="Low-stock alert threshold" required>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={low}
            onChange={(event) => setLow(event.target.value)}
            placeholder="e.g. 10"
          />
        </FormField>

        <p className="text-xs leading-5 text-slate-500 rounded-lg bg-slate-50 border border-slate-100 px-3 py-2">
          Items will show as <strong className="text-amber-600">Low Stock</strong> when quantity drops at or below{" "}
          <strong>{formatNumber(lowNum)} {item.unit}</strong>, and{" "}
          <strong className="text-rose-600">Out of Stock</strong> at exactly 0.
        </p>
      </form>
    </Modal>
  );
}
