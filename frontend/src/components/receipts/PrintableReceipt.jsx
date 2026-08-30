const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const numberFormat = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const money = (value) => `₱${numberFormat.format(Number(value || 0))}`;

export default function PrintableReceipt({
  transaction,
  branchName,
  amountReceived = null,
  change = null,
}) {
  if (!transaction) return null;

  const isCash = transaction.paymentMethod === "CASH";
  const isGcash = transaction.paymentMethod === "GCASH";

  return (
    <div id="print-receipt" className="hidden print:block font-mono text-black text-sm">
      <div className="text-center mb-6">
        <h1 className="font-bold text-xl uppercase tracking-widest mb-1">Taste It Cafe</h1>
        <p className="text-xs uppercase">{branchName}</p>
      </div>

      <div className="space-y-1 text-xs mb-4 pb-4 border-b border-dashed border-black">
        <p>Receipt #: {transaction.transactionId}</p>
        <p>Date: {dateFormat.format(new Date(transaction.createdAt))}</p>
        <p>Cashier: {transaction.cashierName}</p>
      </div>

      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b border-dashed border-black">
            <th className="text-left font-normal pb-1 w-full">Item</th>
            <th className="text-right font-normal pb-1 pl-2">Qty</th>
            <th className="text-right font-normal pb-1 pl-2">Price</th>
            <th className="text-right font-normal pb-1 pl-2">Total</th>
          </tr>
        </thead>
        <tbody className="align-top">
          {transaction.items.map((item, idx) => (
            <tr key={idx}>
              <td className="py-1 pr-2">{item.name}</td>
              <td className="py-1 text-right pl-2">{item.quantity}</td>
              <td className="py-1 text-right pl-2">{money(item.unitPrice)}</td>
              <td className="py-1 text-right pl-2">{money(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="border-t border-dashed border-black pt-4 mb-4 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{money(transaction.subtotal)}</span>
        </div>
        {transaction.discount > 0 && (
          <div className="flex justify-between">
            <span>Discount</span>
            <span>-{money(transaction.discount)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-sm mt-2 pt-2 border-t border-dashed border-black">
          <span>Total</span>
          <span>{money(transaction.total)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1 text-xs">
        <div className="flex justify-between">
          <span>Payment Method</span>
          <span>{isGcash ? "GCash" : "Cash"}</span>
        </div>
        {isCash && amountReceived != null && (
          <div className="flex justify-between">
            <span>Cash Received</span>
            <span>{money(amountReceived)}</span>
          </div>
        )}
        {isCash && change != null && (
          <div className="flex justify-between">
            <span>Change</span>
            <span>{money(change)}</span>
          </div>
        )}
        {isGcash && (
          <div className="flex justify-between">
            <span>Reference</span>
            <span>{transaction.paymentReference || "N/A"}</span>
          </div>
        )}
      </div>

      <div className="text-center text-xs mt-8 pb-8">
        <p>Thank you for visiting!</p>
      </div>
    </div>
  );
}
