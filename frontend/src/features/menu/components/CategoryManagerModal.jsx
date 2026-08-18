import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button, ConfirmDialog, FormField, Input, Modal } from "../../../components/ui";

function CategoryManagerModal({ categories, open, onClose, onSave, onDelete }) {
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [error, setError] = useState("");
  const resetForm = () => { setName(""); setEditingId(null); setError(""); };
  const submit = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return setError("Enter a category name.");
    if (categories.some((category) => category.name.toLowerCase() === trimmedName.toLowerCase() && category.id !== editingId)) return setError("That category already exists.");
    onSave({ id: editingId, name: trimmedName });
    resetForm();
  };
  const startEdit = (category) => { setEditingId(category.id); setName(category.name); setError(""); };

  return <>
    <Modal open={open} onClose={() => { resetForm(); onClose(); }} title="Manage categories" className="max-h-[calc(100vh-2rem)] overflow-y-auto">
      <form className="flex flex-col gap-3 sm:flex-row sm:items-end" onSubmit={submit} noValidate><div className="min-w-0 flex-1"><FormField label={editingId ? "Edit category" : "New category"} required><Input value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Drinks" /></FormField></div><Button type="submit"><Plus size={16} />{editingId ? "Save" : "Add"}</Button></form>
      {error && <p className="mt-2 text-sm text-rose-600" role="alert">{error}</p>}
      <div className="mt-6 divide-y divide-taste-border rounded-xl border border-taste-border">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 px-3 py-3"><span className="text-sm font-medium text-slate-800">{category.name}</span><div className="flex gap-1"><button type="button" onClick={() => startEdit(category)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900" aria-label={`Edit ${category.name}`}><Pencil size={16} /></button><button type="button" onClick={() => setPendingDelete(category)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-700" aria-label={`Delete ${category.name}`}><Trash2 size={16} /></button></div></div>)}</div>
    </Modal>
    <ConfirmDialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)} onConfirm={() => { onDelete(pendingDelete.id); setPendingDelete(null); }} title="Delete category?" description={`Remove ${pendingDelete?.name ?? "this category"} from the menu categories? Existing menu items will remain available for review.`} confirmLabel="Delete category" danger />
  </>;
}

export default CategoryManagerModal;