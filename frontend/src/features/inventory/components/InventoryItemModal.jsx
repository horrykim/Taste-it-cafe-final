import { useState } from "react";
import { Button, FormField, Input, Modal, Select } from "../../../components/ui";

const units = ["pc", "g", "kg", "ml", "L", "packs", "bottles", "boxes"];

function itemForm(item) {
  return {
    name: item?.name ?? "",
    category: item?.category ?? "",
    unit: item?.unit ?? "",
    imageUrl: item?.imageUrl ?? "",
    currentQuantity: item?.currentQuantity?.toString() ?? "0",
    lowStockThreshold: item?.lowStockThreshold?.toString() ?? "",
    targetStockLevel: item?.targetStockLevel?.toString() ?? "",
    costPerUnit: item?.costPerUnit?.toString() ?? "",
    supplier: item?.supplier ?? "",
    active: item?.active ?? true,
  };
}

export function InventoryItemModal({ item, categories, onClose, onSave }) {
  const [form, setForm] = useState(() => itemForm(item));
  const [error, setError] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    const quantity = Number(form.currentQuantity);
    const low = Number(form.lowStockThreshold);
    const target = Number(form.targetStockLevel);
    const cost = form.costPerUnit === "" ? undefined : Number(form.costPerUnit);

    if (!form.name.trim() || !form.category || !form.unit) {
      return setError("Name, category, and unit are required.");
    }
    if (![quantity, low, target].every(Number.isFinite) || quantity < 0 || low < 0 || target < 0) {
      return setError("Quantity and thresholds must be zero or greater.");
    }
    if (cost !== undefined && (!Number.isFinite(cost) || cost < 0)) {
      return setError("Cost per unit must be zero or greater.");
    }
    if (target < low) {
      return setError("Target stock level must be at least the low-stock threshold.");
    }

    onSave({
      ...form,
      name: form.name.trim(),
      supplier: form.supplier.trim(),
      currentQuantity: quantity,
      lowStockThreshold: low,
      targetStockLevel: target,
      costPerUnit: cost,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={item ? "Edit inventory item" : "Add inventory item"}
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="inventory-item-form">
            {item ? "Save changes" : "Add item"}
          </Button>
        </>
      }
    >
      <form id="inventory-item-form" className="space-y-4" noValidate onSubmit={submit}>
        {error && (
          <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </p>
        )}
        <FormField label="Name" required>
          <Input autoFocus value={form.name} onChange={(event) => update("name", event.target.value)} />
        </FormField>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Category" required>
            <Select value={form.category} onChange={(event) => update("category", event.target.value)}>
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category}>{category}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Unit" required>
            <Select value={form.unit} onChange={(event) => update("unit", event.target.value)}>
              <option value="">Select unit</option>
              {units.map((unit) => (
                <option key={unit}>{unit}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={item ? "Current quantity" : "Initial quantity"} required>
            <Input type="number" min="0" step="0.01" value={form.currentQuantity} onChange={(event) => update("currentQuantity", event.target.value)} />
          </FormField>
          <FormField label="Cost per unit">
            <Input type="number" min="0" step="0.01" value={form.costPerUnit} onChange={(event) => update("costPerUnit", event.target.value)} />
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Low-stock threshold" required>
            <Input type="number" min="0" step="0.01" value={form.lowStockThreshold} onChange={(event) => update("lowStockThreshold", event.target.value)} />
          </FormField>
          <FormField label="Target stock level" required>
            <Input type="number" min="0" step="0.01" value={form.targetStockLevel} onChange={(event) => update("targetStockLevel", event.target.value)} />
          </FormField>
        </div>
        <FormField label="Supplier">
          <Input value={form.supplier} onChange={(event) => update("supplier", event.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}
