import { useState } from "react";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../../components/ui";

const getInitialForm = (item) => ({ name: item?.name ?? "", categoryId: item?.categoryId ?? "", price: item?.price?.toString() ?? "", description: item?.description ?? "", status: item?.status ?? "ACTIVE" });

function MenuItemModal({ item, categories, open, onClose, onSave }) {
  const [form, setForm] = useState(() => getInitialForm(item));
  const [error, setError] = useState("");
  const isEditing = Boolean(item);
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const handleSubmit = (event) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim()) return setError("Enter a menu item name.");
    if (!form.categoryId) return setError("Select a category.");
    if (!form.price || !Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    onSave({ ...form, name: form.name.trim(), description: form.description.trim(), price, status: form.status });
  };

  return <Modal open={open} onClose={onClose} title={isEditing ? "Edit menu item" : "Add menu item"} className="max-h-[calc(100vh-2rem)] overflow-y-auto" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="menu-item-form">{isEditing ? "Save changes" : "Add item"}</Button></>}>
    <form id="menu-item-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      <FormField label="Name" required><Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. Classic Burger" autoFocus /></FormField>
      <FormField label="Category" required><Select value={form.categoryId} onChange={(event) => updateField("categoryId", event.target.value)}><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></FormField>
      <FormField label="Price" required hint="Enter the current menu price in Philippine pesos."><Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} placeholder="0.00" /></FormField>
      <FormField label="Description"><Textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe the menu item" /></FormField>
      <FormField label="Availability" required><Select value={form.status} onChange={(event) => updateField("status", event.target.value)}><option value="ACTIVE">Available</option><option value="INACTIVE">Unavailable</option></Select></FormField>
    </form>
  </Modal>;
}

export default MenuItemModal;