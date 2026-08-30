import { useState } from "react";
import { Button, FormField, Input, Modal, Select } from "../../../components/ui";


function itemForm(item) {
  return {
    name: item?.name ?? "",
    categoryId: item?.categoryId ?? "",
    unitId: item?.unitId ?? "",
    description: item?.description ?? "",
    imageUrl: item?.imageUrl ?? "",
    currentQuantity: item?.currentQuantity?.toString() ?? "0",
    lowStockThreshold: item?.lowStockThreshold?.toString() ?? "",
    active: item?.active ?? true,
  };
}

export function InventoryItemModal({ item, categories, units, onClose, onSave }) {
  const [form, setForm] = useState(() => itemForm(item));
  const [error, setError] = useState("");

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  const submit = (event) => {
    event.preventDefault();
    const quantity = Number(form.currentQuantity);
    const low = Number(form.lowStockThreshold);

    if (!form.name.trim() || !form.categoryId || !form.unitId) {
      return setError("Name, category, and unit are required.");
    }
    if (![quantity, low].every(Number.isFinite) || quantity < 0 || low < 0) {
      return setError("Quantity and thresholds must be zero or greater.");
    }

    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim(),
      currentQuantity: quantity,
      lowStockThreshold: low,
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
            <Select value={form.categoryId} onChange={(event) => update("categoryId", event.target.value)}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </FormField>
          <FormField label="Unit" required>
            <Select value={form.unitId} onChange={(event) => update("unitId", event.target.value)}>
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </Select>
          </FormField>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label={item ? "Current quantity" : "Initial quantity"} required>
            <Input type="number" min="0" step="0.01" value={form.currentQuantity} onChange={(event) => update("currentQuantity", event.target.value)} />
          </FormField>
          <FormField label="Low-stock threshold" required>
            <Input type="number" min="0" step="0.01" value={form.lowStockThreshold} onChange={(event) => update("lowStockThreshold", event.target.value)} />
          </FormField>
        </div>
        <FormField label="Description">
          <Input value={form.description} onChange={(event) => update("description", event.target.value)} />
        </FormField>
      </form>
    </Modal>
  );
}
