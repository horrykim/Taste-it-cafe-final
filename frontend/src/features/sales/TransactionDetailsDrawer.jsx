
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
  const amountReceived = transaction.amountReceived ?? transaction.total;
  const change = transaction.change ?? (amountReceived - transaction.total);

  return (
    <Drawer open={!!transaction} onClose={onClose} title="Transaction Details" width={420}>
      <div className="flex h-full flex-col bg-white">
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
          
          <div className="space-y-4">
            <Badge variant="green" className="w-fit">{transaction.status === "COMPLETED" ? "Completed" : transaction.status}</Badge>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-4 text-sm">
              <div>
                <p className="mb-1 text-xs text-slate-500">Transaction ID</p>
                <p className="font-medium text-slate-900">{transaction.transactionId}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Date & Time</p>
                <p className="font-medium text-slate-900">{dateFormat.format(new Date(transaction.createdAt))}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Cashier</p>
                <p className="font-medium text-slate-900">{transaction.cashierName}</p>
                {transaction.cashierRole && (
                  <p className="text-xs text-slate-500 mt-0.5">{transaction.cashierRole === "OWNER" ? "Owner / Manager" : "Staff"}</p>
                )}
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Branch</p>
                <p className="font-medium text-slate-900">{branchName}</p>
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-500">Payment Method</p>
                <p className="font-medium text-slate-900">{paymentLabel(transaction.paymentMethod)}</p>
              </div>
              
              {isGcash && (
                <div>
                  <p className="mb-1 text-xs text-slate-500">Reference Number</p>
                  <p className="font-medium text-slate-900">{transaction.paymentReference || "—"}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Items Purchased</h3>
            <div className="rounded-xl border border-taste-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell as="th" className="py-2.5">Item</TableCell>
                    <TableCell as="th" className="py-2.5">Qty</TableCell>
                    <TableCell as="th" className="py-2.5">Price</TableCell>
                    <TableCell as="th" className="py-2.5 text-right">Amount</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.items.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="py-2.5 font-medium text-slate-900">{item.name}</TableCell>
                      <TableCell className="py-2.5 text-slate-600">{item.quantity}</TableCell>
                      <TableCell className="py-2.5 text-slate-600">{money(item.unitPrice)}</TableCell>
                      <TableCell className="py-2.5 text-right font-medium text-slate-900">{money(item.lineTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4 space-y-2 text-sm">
            <div className="flex justify-between text-slate-600">
              <p>Subtotal</p>
              <p>{money(transaction.subtotal)}</p>
            </div>
            {transaction.discount > 0 && (
              <div className="flex justify-between text-slate-600">
                <p>Discount</p>
                <p>-{money(transaction.discount)}</p>
              </div>
            )}
            <div className="flex justify-between pt-2 text-base font-bold text-slate-900 border-t border-taste-border">
              <p>Total</p>
              <p>{money(transaction.total)}</p>
            </div>
            
            {isCash && (
              <div className="pt-2 mt-2 space-y-1.5 border-t border-taste-border border-dashed">
                <div className="flex justify-between text-slate-600">
                  <p>Amount Received</p>
                  <p>{money(amountReceived)}</p>
                </div>
                <div className="flex justify-between text-slate-600">
                  <p>Change</p>
                  <p>{money(change)}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-taste-border p-6 bg-white">
          <Button className="w-full justify-center shadow-md">
            Print Receipt
          </Button>
        </div>
      </div>
    </Drawer>
  );
}
