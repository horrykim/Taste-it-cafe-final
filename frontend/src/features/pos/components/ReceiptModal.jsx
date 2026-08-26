import { Button, Modal } from "../../../components/ui";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dateTimeFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });

// Digital receipt for a completed sale.
//
// `customisations` maps a line key -> array of removed ingredient names, and
// is passed in from POS.jsx rather than read off `sale`, because the mock
// transaction service doesn't persist per-line ingredient removals. It's
// still shown here so the printed/handed receipt reflects what the kitchen
// was told (e.g. "No onions").
function ReceiptModal({ sale, branchName, customisations = {}, onClose, onNew }) {
  return (
    <Modal
      open
      onClose={onClose}
      title="Digital receipt"
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Close receipt</Button>
          <Button variant="secondary" onClick={onNew}>New transaction</Button>
        </>
      }
    >
      <div className="space-y-5 text-sm">
        <div className="text-center">
          <h3 className="text-lg font-bold text-slate-900">Taste It Café</h3>
          <p className="mt-1 text-slate-500">{branchName} · {sale.transactionId}</p>
          <p className="text-slate-500">{dateTimeFormat.format(new Date(sale.createdAt))}</p>
        </div>

        <p className="text-slate-600">Cashier: <strong className="text-slate-900">{sale.cashierName}</strong></p>

        <div className="divide-y divide-taste-border border-y border-taste-border">
          {sale.items.map((item) => {
            const removed = customisations[item.menuItemId] ?? [];
            return (
              <div key={`${item.menuItemId}-${item.name}`} className="flex justify-between gap-3 py-3">
                <span className="min-w-0 text-slate-700">
                  <span className="font-medium text-slate-900">{item.name}</span> × {item.quantity}
                  <small className="mt-0.5 block text-slate-500">{money(item.unitPrice)} each</small>
                  {removed.length > 0 && (
                    <small className="mt-1 block font-medium text-amber-700">No {removed.join(", ")}</small>
                  )}
                </span>
                <strong className="shrink-0 text-slate-900">{money(item.lineTotal)}</strong>
              </div>
            );
          })}
        </div>

        <div className="space-y-1 text-right">
          <p className="text-slate-600">Subtotal: {money(sale.subtotal)}</p>
          <p className="text-lg font-bold text-slate-900">Total: {money(sale.total)}</p>
        </div>

        <p className="text-slate-600">
          Payment: <strong className="text-slate-900">{sale.paymentMethod === "GCASH" ? "GCash / QR" : "Cash"}</strong>
          {sale.paymentReference && <span> · Ref: {sale.paymentReference}</span>}
        </p>
      </div>
    </Modal>
  );
}

export default ReceiptModal;