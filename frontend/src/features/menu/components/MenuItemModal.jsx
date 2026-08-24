import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button, FormField, Input, Modal, Select, Textarea } from "../../../components/ui";
import MenuImage from "./MenuImage";

const getInitialForm = (item) => ({ name: item?.name ?? "", categoryId: item?.categoryId ?? "", price: item?.price?.toString() ?? "", description: item?.description ?? "", imageUrl: item?.imageUrl ?? "", status: item?.status ?? "ACTIVE", recipe: item?.recipe?.map((entry) => ({ ...entry, quantity: entry.quantity.toString() })) ?? [] });

function MenuItemModal({ item, categories, ingredients, open, onClose, onSave }) {
  const [form, setForm] = useState(() => getInitialForm(item));
  const [error, setError] = useState("");
  const isEditing = Boolean(item);
  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateRecipe = (index, field, value) => setForm((current) => ({ ...current, recipe: current.recipe.map((entry, entryIndex) => entryIndex === index ? { ...entry, [field]: value } : entry) }));
  const addIngredient = () => setForm((current) => ({ ...current, recipe: [...current.recipe, { ingredientId: "", quantity: "", unit: "" }] }));
  const removeIngredient = (index) => setForm((current) => ({ ...current, recipe: current.recipe.filter((_, entryIndex) => entryIndex !== index) }));
  const selectIngredient = (index, ingredientId) => {
    const ingredient = ingredients.find((entry) => entry.id === ingredientId);
    setForm((current) => ({ ...current, recipe: current.recipe.map((entry, entryIndex) => entryIndex === index ? { ...entry, ingredientId, unit: ingredient?.unit ?? "" } : entry) }));
  };
  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    const reader = new FileReader();
    reader.onload = () => updateField("imageUrl", reader.result);
    reader.readAsDataURL(file);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    const price = Number(form.price);
    if (!form.name.trim()) return setError("Enter a menu item name.");
    if (!form.categoryId) return setError("Select a category.");
    if (!form.price || !Number.isFinite(price) || price < 0) return setError("Enter a valid price.");
    const recipe = form.recipe.map((entry) => ({ ...entry, quantity: Number(entry.quantity) }));
    if (recipe.some((entry) => !entry.ingredientId || !Number.isFinite(entry.quantity) || entry.quantity <= 0)) return setError("Choose an ingredient and enter a quantity greater than zero for every recipe row.");
    if (new Set(recipe.map((entry) => entry.ingredientId)).size !== recipe.length) return setError("An ingredient can only appear once in a recipe.");
    onSave({ ...form, name: form.name.trim(), description: form.description.trim(), imageUrl: form.imageUrl || null, price, status: form.status, recipe });
  };

  return <Modal open={open} onClose={onClose} title={isEditing ? "Edit menu item" : "Add menu item"} className="max-h-[calc(100vh-2rem)] overflow-y-auto" footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button type="submit" form="menu-item-form">{isEditing ? "Save changes" : "Add item"}</Button></>}>
    <form id="menu-item-form" className="space-y-4" onSubmit={handleSubmit} noValidate>
      {error && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">{error}</p>}
      <FormField label="Name" required><Input value={form.name} onChange={(event) => updateField("name", event.target.value)} placeholder="e.g. Classic Burger" autoFocus /></FormField>
      <FormField label="Category" required><Select value={form.categoryId} onChange={(event) => updateField("categoryId", event.target.value)}><option value="">Select a category</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</Select></FormField>
      <FormField label="Price" required hint="Enter the current menu price in Philippine pesos."><Input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateField("price", event.target.value)} placeholder="0.00" /></FormField>
      <FormField label="Description"><Textarea value={form.description} onChange={(event) => updateField("description", event.target.value)} placeholder="Describe the menu item" /></FormField>
      <FormField label="Image (Optional)" hint="Choose an image from this device. It is stored only in the frontend mock state."><Input type="file" accept="image/*" onChange={chooseImage} /></FormField>
      <div className="flex flex-wrap items-start gap-3"><MenuImage imageUrl={form.imageUrl} alt={form.name || "Menu item"} className="h-24 w-36 rounded-xl" />{form.imageUrl && <Button type="button" variant="ghost" size="sm" onClick={() => updateField("imageUrl", "")}>Remove image</Button>}</div>
      <FormField label="Availability" required><Select value={form.status} onChange={(event) => updateField("status", event.target.value)}><option value="ACTIVE">Available</option><option value="INACTIVE">Unavailable</option></Select></FormField>
      <section className="rounded-2xl border border-taste-border bg-slate-50 p-4" aria-labelledby="recipe-heading"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 id="recipe-heading" className="font-semibold text-slate-900">Recipe / Ingredients</h3><p className="mt-1 text-xs text-slate-500">Ingredients used for one menu item. Stock is not deducted yet.</p></div><Button type="button" size="sm" variant="outline" onClick={addIngredient}><Plus size={16} />Add ingredient</Button></div><div className="mt-4 space-y-3">{form.recipe.length ? form.recipe.map((entry, index) => { const ingredient = ingredients.find((option) => option.id === entry.ingredientId); return <div key={`${entry.ingredientId}-${index}`} className="grid gap-3 rounded-xl border border-taste-border bg-white p-3 sm:grid-cols-[minmax(0,1fr)_7rem_6rem_auto] sm:items-end"><FormField label={`Ingredient ${index + 1}`}><Select value={entry.ingredientId} onChange={(event) => selectIngredient(index, event.target.value)}><option value="">Select ingredient</option>{ingredients.map((option) => <option key={option.id} value={option.id}>{option.name} · {option.currentQuantity} {option.unit} · {option.status.replace("-", " ")}</option>)}</Select></FormField><FormField label="Quantity"><Input type="number" min="0" step="0.01" value={entry.quantity} onChange={(event) => updateRecipe(index, "quantity", event.target.value)} placeholder="0" /></FormField><FormField label="Unit"><Input value={entry.unit || ingredient?.unit || ""} readOnly aria-label={`Unit for ingredient ${index + 1}`} /></FormField><Button type="button" variant="ghost" size="sm" className="text-rose-700 hover:bg-rose-50 hover:text-rose-800" onClick={() => removeIngredient(index)} aria-label={`Remove ${ingredient?.name ?? `ingredient ${index + 1}`}`}><Trash2 size={16} />Remove</Button>{ingredient && <p className="text-xs text-slate-500 sm:col-span-4">Current stock: {ingredient.currentQuantity} {ingredient.unit} · {ingredient.status.replace("-", " ")}</p>}</div>; }) : <p className="rounded-xl border border-dashed border-taste-border px-3 py-4 text-sm text-slate-500">No ingredients added. You can save this item without a recipe.</p>}</div></section>
    </form>
  </Modal>;
}

export default MenuItemModal;
