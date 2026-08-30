
import { Badge, Button, Table, TableBody, TableCell, TableHeader, TableRow } from "../../components/ui";
import { Drawer } from "../../components/ui/Overlay";

const dateFormat = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeStyle: "short" });
const numberFormat = new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (value) => `₱${numberFormat.format(value)}`;
const paymentLabel = (method) => (method === "GCASH" ? "GCash" : method === "CASH" ? "Cash" : method);

export default function TransactionDetailsDrawer({ transaction, branchName, onClose }) {
  if (!transaction) return null;

  const isCash = transaction.paymentMethod === "CASH";
  const isGcash = transaction.paymentMethod === "GCASH";
  
  // Try to use amounts from transaction if they exist (future-proofing)
  // For now, assume exact amount for mock cash transactions if missing
  const amountReceived = transaction.cashReceived ?? transaction.total;
  const change = transaction.changeAmount ?? (amountReceived - transaction.total);

  return (
    <Drawer open={!!transaction} onClose={onClose} title="Transaction Details" width={420}>
      <div className="flex h-full flex-col bg-white">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <Badge variant="green" className="w-fit text-xs px-2.5 py-0.5 shadow-sm">{transaction.status === "COMPLETED" ? "Completed" : transaction.status}</Badge>
              <p className="text-sm font-semibold text-slate-500">{dateFormat.format(new Date(transaction.createdAt))}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-y-5 gap-x-4 text-sm bg-slate-50/50 p-4 rounded-xl border border-slate-100">
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Transaction ID</p>
                <p className="font-bold text-taste-purple">{transaction.transactionId}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Cashier</p>
                <p className="font-bold text-slate-900">{transaction.cashierName}</p>
                {transaction.cashierRole && (
                  <p className="text-[11px] font-semibold text-slate-500 mt-0.5 uppercase tracking-wide">{transaction.cashierRole === "OWNER" ? "Owner / Manager" : "Staff"}</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Branch</p>
                <p className="font-bold text-slate-900">{branchName}</p>
              </div>
              <div>
                <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Payment Method</p>
                <p className="font-bold text-slate-900">{paymentLabel(transaction.paymentMethod)}</p>
              </div>
              
              {isGcash && (
                <div>
                  <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-slate-500">Reference Number</p>
                  <p className="font-bold text-slate-900">{transaction.paymentReference || "—"}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 pl-1">Items Purchased</h3>
            <div className="rounded-xl border border-slate-200 shadow-sm overflow-hidden bg-white">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableCell as="th" className="py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Item</TableCell>
                    <TableCell as="th" className="py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Qty</TableCell>
                    <TableCell as="th" className="py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">Price</TableCell>
                    <TableCell as="th" className="py-2.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-right">Amount</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="py-3 font-semibold text-slate-900">{item.name}</TableCell>
                      <TableCell className="py-3 font-medium text-slate-600">{item.quantity}</TableCell>
                      <TableCell className="py-3 font-medium text-slate-600">{money(item.unitPrice)}</TableCell>
                      <TableCell className="py-3 text-right font-bold text-slate-900">{money(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-5 space-y-2.5 text-sm shadow-sm">
            <div className="flex justify-between font-medium text-slate-600">
              <p>Subtotal</p>
              <p>{money(transaction.subtotal)}</p>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between font-medium text-slate-600">
                <p>Discount</p>
                <p className="text-red-600">-{money(transaction.discount)}</p>
              </div>
            )}
            <div className="flex justify-between pt-3 text-lg font-extrabold text-slate-900 border-t border-slate-200 mt-1">
              <p>Total</p>
              <p className="text-taste-purple-strong">{money(transaction.total)}</p>
            </div>
            
            {isCash && (
              <div className="pt-3 mt-3 space-y-2 border-t border-slate-200 border-dashed">
                <div className="flex justify-between font-medium text-slate-600">
                  <p>Amount Received</p>
                  <p className="text-slate-900">{money(amountReceived)}</p>
                </div>
                <div className="flex justify-between font-medium text-slate-600">
                  <p>Change</p>
                  <p className="text-slate-900">{money(change)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-taste-border p-6 bg-white">
          <Button onClick={() => window.print()} className="w-full justify-center shadow-md">
            Print Receipt
          </Button>
        </div>
      </div>
      
      {/* Hidden Print Receipt */}
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

        {isCash && (
          <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Cash Received</span>
              <span>{money(amountReceived)}</span>
            </div>
            <div className="flex justify-between">
              <span>Change</span>
              <span>{money(change)}</span>
            </div>
          </div>
        )}

        {isGcash && (
          <div className="border-t border-dashed border-black pt-2 mb-4 space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Payment Method</span>
              <span>GCash</span>
            </div>
            <div className="flex justify-between">
              <span>Reference</span>
              <span>{transaction.paymentReference || "N/A"}</span>
            </div>
          </div>
        )}

        <div className="text-center text-xs mt-8 pb-8">
          <p>Thank you for visiting!</p>
        </div>
      </div>
    </Drawer>
  );
}
