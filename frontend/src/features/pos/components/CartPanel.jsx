import { ReceiptText, ShoppingCart, Wallet } from "lucide-react";
import { Button, Card, FormField, Input } from "../../../components/ui";
import FilterDropdown from "../../menu/components/FilterDropdown";
import CartLineItem from "./CartLineItem";

const money = (value) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PAYMENT_GROUPS = [{
  options: [
    { value: "CASH", label: "Cash", dotColor: "#10B981" },
    { value: "GCASH", label: "GCash / QR", dotColor: "#3B82F6" },
  ],
}];

function CartPanel({
  cart,
  ingredients,
  subtotal,
  cartCount,
  paymentMethod,
  amountReceived,
  reference,
  cashChange,
  insufficientCash,
  canComplete,
  onChangePaymentMethod,
  onChangeAmountReceived,
  onChangeReference,
  onUpdateQuantity,
  onRemoveItem,
  onToggleIngredient,
  onClearCart,
  onCompleteSale,
}) {
  return (
    <Card className="flex h-fit flex-col overflow-hidden xl:sticky xl:top-6 xl:max-h-[calc(100vh-3rem)]">
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-taste-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#B6F9FF] text-[#062B56]">
            <ShoppingCart size={19} aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-slate-900">Current transaction</h2>
            <p className="mt-0.5 text-xs text-slate-500">{cartCount} item{cartCount === 1 ? "" : "s"}</p>
          </div>
        </div>
        {cart.length > 0 && <Button variant="ghost" size="sm" onClick={onClearCart}>Clear</Button>}
      </div>

      {cart.length === 0 ? (
        <div className="flex min-h-52 flex-col items-center justify-center px-5 py-10 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <ShoppingCart size={21} aria-hidden="true" />
          </span>
          <h3 className="mt-4 text-base font-semibold text-slate-900">Your cart is empty</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500">Tap an item to add it to the order.</p>
        </div>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-5">
          {cart.map((line) => (
            <CartLineItem
              key={line.lineId}
              line={line}
              ingredients={ingredients}
              onUpdateQuantity={onUpdateQuantity}
              onRemove={onRemoveItem}
              onToggleIngredient={onToggleIngredient}
            />
          ))}
        </div>
      )}

      {cart.length > 0 && (
        <div className="shrink-0 space-y-4 border-t border-taste-border p-5">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between text-slate-600">
              <span>Subtotal</span>
              <strong className="text-slate-900">{money(subtotal)}</strong>
            </div>
            <div className="flex items-center justify-between border-t border-taste-border pt-2 text-base font-semibold text-slate-900">
              <span>Total</span>
              <strong>{money(subtotal)}</strong>
            </div>
          </div>

          <FormField label="Payment method">
            <FilterDropdown
              label="Cash"
              value={paymentMethod}
              onChange={onChangePaymentMethod}
              groups={PAYMENT_GROUPS}
              panelClassName="w-full"
            />
          </FormField>

          {paymentMethod === "CASH" ? (
            <>
              <FormField label="Amount received">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountReceived}
                  onChange={(event) => onChangeAmountReceived(event.target.value)}
                  placeholder="0.00"
                  aria-label="Cash amount received"
                  error={insufficientCash || undefined}
                />
              </FormField>

              <div className="rounded-xl border border-taste-border bg-slate-50 px-3 py-2.5 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Change</span>
                  <strong className="text-slate-900">{money(cashChange)}</strong>
                </div>
              </div>

              {insufficientCash && (
                <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  Amount received is less than the total.
                </p>
              )}
            </>
          ) : (
            <FormField label="Reference number" hint="Enter the GCash / QR reference from the customer's receipt.">
              <Input
                value={reference}
                onChange={(event) => onChangeReference(event.target.value)}
                placeholder="e.g. 123456789"
                aria-label="Payment reference number"
              />
            </FormField>
          )}

          <div className="flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-xs leading-5 text-slate-600">
            <Wallet size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            <span>Payment is recorded only. Taste It does not process payments.</span>
          </div>

          <Button variant="secondary" className="w-full" size="lg" disabled={!canComplete} onClick={onCompleteSale}>
            <ReceiptText size={16} aria-hidden="true" />
            Complete sale
          </Button>
        </div>
      )}
    </Card>
  );
}

export default CartPanel;