import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronLeft } from "lucide-react";
import { Button, FormField, Input, Modal, Select, Textarea, ConfirmDialog } from "../../../components/ui";
import MenuImage from "./MenuImage";
import FilterDropdown from "./FilterDropdown";
import { cn } from "../../../utils/cn";

const getInitialForm = (item) => ({
  name: item?.name ?? "",
  categoryId: item?.categoryId ?? "",
  price: item?.price?.toString() ?? "",
  description: item?.description ?? "",
  imageUrl: item?.imageUrl ?? "",
  status: item?.status ?? "ACTIVE",
  recipe: item?.recipe?.map((entry) => ({ ...entry, quantity: entry.quantity.toString() })) ?? []
});

function StepIndicator({ currentStep, totalSteps, onStepClick, isStep1Valid }) {
  const handleBasicClick = (e) => {
    e.preventDefault();
    if (currentStep === 2) onStepClick(1);
  };

  const handleRecipeClick = (e) => {
    e.preventDefault();
    if (currentStep === 1 && isStep1Valid) onStepClick(2);
  };

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="font-medium text-slate-700">Step {currentStep} of {totalSteps}</span>
      <span className="text-slate-300">•</span>

      {currentStep === 2 ? (
        <button
          type="button"
          onClick={handleBasicClick}
          className="font-medium text-[#F777D1] hover:underline focus:outline-none"
        >
          Basic Info
        </button>
      ) : (
        <span className="font-medium text-[#F777D1]">Basic Info</span>
      )}

      <span className="text-slate-300 text-lg font-light">›</span>

      {currentStep === 1 && isStep1Valid ? (
        <button
          type="button"
          onClick={handleRecipeClick}
          className="font-medium text-slate-400 hover:text-[#F777D1] hover:underline focus:outline-none"
        >
          Recipe
        </button>
      ) : currentStep === 2 ? (
        <span className="font-medium text-[#F777D1]">Recipe</span>
      ) : (
        <span className="font-medium text-slate-400">Recipe</span>
      )}
    </div>
  );
}

function MenuItemModal({ item, categories, ingredients, open, onClose, onSave }) {
  const [form, setForm] = useState(() => getInitialForm(item));
  const [originalForm, setOriginalForm] = useState(() => getInitialForm(item));
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [showSuccessConfirm, setShowSuccessConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDeleteIndex, setConfirmingDeleteIndex] = useState(null);
  const isEditing = Boolean(item);

  useEffect(() => {
    const initial = getInitialForm(item);
    setForm(initial);
    setOriginalForm(initial);
    setStep(1);
    setError("");
  }, [item]);

  const updateField = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const updateRecipe = (index, field, value) => setForm((current) => ({
    ...current,
    recipe: current.recipe.map((entry, entryIndex) =>
      entryIndex === index ? { ...entry, [field]: value } : entry
    )
  }));

  const addIngredient = () => setForm((current) => ({
    ...current,
    recipe: [...current.recipe, { ingredientId: "", quantity: "", unit: "" }]
  }));

  const removeIngredient = (index) => setForm((current) => ({
    ...current,
    recipe: current.recipe.filter((_, entryIndex) => entryIndex !== index)
  }));

  const selectIngredient = (index, ingredientId) => {
    const ingredient = ingredients.find((entry) => entry.id === ingredientId);
    setForm((current) => ({
      ...current,
      recipe: current.recipe.map((entry, entryIndex) =>
        entryIndex === index ? {
          ...entry,
          ingredientId,
          unit: ingredient?.unit ?? ""
        } : entry
      )
    }));
  };

  const chooseImage = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose an image file.");
    const reader = new FileReader();
    reader.onload = () => updateField("imageUrl", reader.result);
    reader.readAsDataURL(file);
  };

  const isStep1Valid = () => {
    const price = Number(form.price);
    return (
      form.name.trim() !== "" &&
      form.categoryId !== "" &&
      form.categoryId !== "placeholder" &&
      form.price !== "" &&
      !isNaN(price) &&
      price >= 0
    );
  };

  const goToStep2 = (event) => {
    if (event) event.preventDefault();
    if (!isStep1Valid()) return;
    setError("");
    setStep(2);
  };

  const goToStep1 = (event) => {
    if (event) event.preventDefault();
    setError("");
    setStep(1);
  };

  const handleStepClick = (targetStep) => {
    if (targetStep === 1) {
      goToStep1();
    } else if (targetStep === 2 && isStep1Valid()) {
      goToStep2();
    }
  };

  const hasActualChanges = () => {
    if (!originalForm) return false;
    return JSON.stringify(form) !== JSON.stringify(originalForm);
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleCloseAttempt = () => {
    if (hasActualChanges()) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (step === 1) {
      setError("Please fill in all required fields and click Next to continue.");
      return;
    }

    const price = Number(form.price);
    if (!form.name.trim()) return setError("Enter a menu item name.");
    if (!form.categoryId) return setError("Select a category.");
    if (!form.price || !Number.isFinite(price) || price < 0) return setError("Enter a valid price.");

    if (form.recipe.length === 0) {
      return setError("Please add at least one ingredient to the recipe.");
    }

    const recipe = form.recipe.map((entry) => ({ ...entry, quantity: Number(entry.quantity) }));
    if (recipe.some((entry) => !entry.ingredientId || !Number.isFinite(entry.quantity) || entry.quantity <= 0)) {
      return setError("Choose an ingredient and enter a quantity greater than zero for every recipe row.");
    }
    if (new Set(recipe.map((entry) => entry.ingredientId)).size !== recipe.length) {
      return setError("An ingredient can only appear once in a recipe.");
    }

    setIsSubmitting(true);
    try {
      await onSave({
        ...form,
        name: form.name.trim(),
        description: form.description.trim(),
        imageUrl: form.imageUrl || null,
        price,
        status: form.status,
        recipe
      });
      setShowSuccessConfirm(true);
    } catch (err) {
      setError(err.message || "Failed to save menu item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessConfirm = () => {
    setShowSuccessConfirm(false);
    onClose();
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && step === 1) {
      event.preventDefault();
    }
  };

  const categoryOptions = [
    { value: "placeholder", label: "Select a category" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    }))
  ];

  const statusOptions = [
    { value: "ACTIVE", label: "Available" },
    { value: "INACTIVE", label: "Unavailable" },
  ];

  const getQuantityPlaceholder = (unit) => {
    if (!unit) return "Enter amount";
    const u = unit.toLowerCase();
    if (u === "ml" || u === "l" || u === "litre" || u === "liters") return `e.g. 250 ${unit}`;
    if (u === "g" || u === "kg" || u === "gram" || u === "grams") return `e.g. 150 ${unit}`;
    if (u === "pcs" || u === "piece" || u === "pieces") return `e.g. 3 ${unit}`;
    return `e.g. 10 ${unit}`;
  };

  const getQuantityInputProps = (unit) => {
    if (!unit) return { step: "0.01", min: "0" };
    const u = unit.toLowerCase();
    if (u === "pcs" || u === "piece" || u === "pieces" || u === "pc") {
      return { step: "1", min: "1" };
    }
    return { step: "0.01", min: "0" };
  };

  const renderStep1 = () => (
    <>
      <FormField label="Category" required>
        <FilterDropdown
          label="Select a category"
          placeholder="Select a category"
          value={form.categoryId || "placeholder"}
          onChange={(value) => updateField("categoryId", value)}
          groups={[{ options: categoryOptions }]}
          className="w-full"
          panelClassName="w-full"
        />
      </FormField>

      <FormField label="Name" required>
        <Input
          value={form.name}
          onChange={(event) => updateField("name", event.target.value)}
          placeholder="e.g. Classic Burger"
          autoFocus
        />
      </FormField>

      <FormField label="Price" required hint="Enter the current menu price in Philippine pesos.">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={form.price}
          onChange={(event) => updateField("price", event.target.value)}
          placeholder="0.00"
        />
      </FormField>

      <FormField label="Availability" required>
        <FilterDropdown
          label="Available"
          placeholder="Select status"
          value={form.status}
          onChange={(value) => updateField("status", value)}
          groups={[{
            options: statusOptions.map(opt => ({
              ...opt,
              dotColor: opt.value === "ACTIVE" ? "#10B981" : "#8E8E8E"
            }))
          }]}
          className="w-full"
          panelClassName="w-full"
        />
      </FormField>

      <FormField label="Description (Optional)">
        <Textarea
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          placeholder="Describe the menu item"
        />
      </FormField>

      <FormField label="Image (Optional)" hint="Choose an image from this device.">
        <Input type="file" accept="image/*" onChange={chooseImage} />
      </FormField>

      {form.imageUrl && (
        <div className="flex flex-wrap items-start gap-3">
          <MenuImage imageUrl={form.imageUrl} alt={form.name || "Menu item"} className="h-24 w-36 rounded-xl" />
          <Button type="button" variant="ghost" size="sm" onClick={() => updateField("imageUrl", "")}>
            Remove image
          </Button>
        </div>
      )}
    </>
  );

  const renderStep2 = () => {
    const getIngredientOptions = () => {
      return ingredients.map((ingredient) => ({
        value: ingredient.id,
        label: ingredient.name,
        dotColor: ingredient.status === "in-stock" ? "#10B981"
          : ingredient.status === "low-stock" ? "#FF9500"
          : ingredient.status === "out-of-stock" ? "#FF7B7B"
          : "#8E8E8E",
      }));
    };

    const hasIngredients = form.recipe.length > 0;

    return (
      <>
        <section className="rounded-2xl border border-taste-border bg-slate-50 p-5" aria-labelledby="recipe-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 id="recipe-heading" className="text-base font-semibold text-slate-900">Recipe / Ingredients</h3>
              <p className="mt-1 text-sm text-slate-500">Ingredients used for one menu item. Stock is not deducted yet.</p>
            </div>
            {!hasIngredients && (
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={addIngredient}
                className="h-10 w-10 rounded-full !p-0"
                aria-label="Add ingredient"
              >
                <Plus size={20} />
              </Button>
            )}
          </div>

          <div className="mt-4 space-y-4">
            {hasIngredients ? (
              <>
                {form.recipe.map((entry, index) => {
                  const ingredient = ingredients.find((option) => option.id === entry.ingredientId);
                  const unit = entry.unit || ingredient?.unit || "";
                  const quantityProps = getQuantityInputProps(unit);

                  // Show confirmation card if this index is being deleted
                  if (confirmingDeleteIndex === index) {
                    return (
                      <div
                        key={`confirm-${entry.ingredientId || index}`}
                        className="rounded-xl border-2 border-rose-200 bg-rose-50/50 p-5 shadow-sm"
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-700">
                            <span className="text-lg font-bold">!</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-rose-800">
                              Remove "{ingredient?.name || "this ingredient"}"?
                            </p>
                            <p className="mt-1 text-sm text-rose-600">This action cannot be undone.</p>
                            <div className="mt-4 flex gap-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setConfirmingDeleteIndex(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                  removeIngredient(index);
                                  setConfirmingDeleteIndex(null);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }

                  // Normal ingredient card – show name in header
                  return (
                    <div
                      key={`${entry.ingredientId || index}-${index}`}
                      className="rounded-xl border border-taste-border bg-white p-5 shadow-sm transition hover:shadow-md"
                    >
                      <div className="mb-4 flex items-center gap-2">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FDEAFA] text-xs font-semibold text-[#B82188]">
                          {index + 1}
                        </span>
                        <span className="text-sm font-medium text-slate-700">
                          {ingredient?.name || "Select ingredient"}
                        </span>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-[2fr_80px_80px_auto] sm:items-end">
                        <div className="min-w-0">
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Ingredient <span className="text-rose-600">*</span>
                          </label>
                          <FilterDropdown
                            label="Select ingredient"
                            placeholder="Select ingredient"
                            value={entry.ingredientId || ""}
                            onChange={(value) => selectIngredient(index, value)}
                            groups={[{ options: getIngredientOptions() }]}
                            className="w-full"
                            panelClassName="w-full"
                          />
                        </div>

                        <div className="min-w-0">
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Qty {unit ? <span className="text-xs font-normal text-slate-400">({unit})</span> : <span className="text-rose-600">*</span>}
                          </label>
                          <Input
                            type="number"
                            step={quantityProps.step}
                            min={quantityProps.min}
                            value={entry.quantity}
                            onChange={(event) => updateRecipe(index, "quantity", event.target.value)}
                            placeholder={getQuantityPlaceholder(unit)}
                            className="w-full"
                          />
                        </div>

                        <div className="min-w-0">
                          <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Unit
                            {unit && <span className="ml-1 text-xs font-normal text-slate-400">(auto)</span>}
                          </label>
                          <Input
                            value={unit}
                            readOnly
                            className="w-full bg-slate-50 text-slate-600"
                            aria-label={`Unit for ingredient ${index + 1}`}
                          />
                        </div>

                        <div className="flex items-end">
                          <button
                            type="button"
                            onClick={() => setConfirmingDeleteIndex(index)}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-taste-border bg-white text-slate-400 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F777D1]"
                            aria-label={`Remove ${ingredient?.name ?? `ingredient ${index + 1}`}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {ingredient && (
                        <div className="mt-4 rounded-lg bg-slate-50 px-3 py-2">
                          <p className="text-sm text-slate-500">
                            Current stock: <span className="font-medium text-slate-700">{ingredient.currentQuantity} {ingredient.unit}</span>
                            <span className="mx-2 text-slate-300">·</span>
                            Status: <span className="font-medium text-slate-700">{ingredient.status.replace("-", " ")}</span>
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}

                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={addIngredient}
                  className="w-full"
                >
                  <Plus size={16} /> Add ingredient
                </Button>
              </>
            ) : (
              <div className="rounded-xl border border-dashed border-taste-border bg-white/60 px-5 py-8 text-center">
                <p className="text-sm text-slate-500">No ingredients added yet.</p>
                <p className="mt-1 text-sm text-slate-400">
                  Click the <span className="font-medium text-[#F777D1]">+ button</span> to add ingredients.
                </p>
              </div>
            )}
          </div>
        </section>

        <div className="rounded-xl border border-taste-border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Item Summary</p>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span className="font-medium text-slate-900">{form.name || "Untitled"}</span>
            <span className="text-slate-400">•</span>
            <span className="text-slate-600">
              {categories.find((c) => c.id === form.categoryId)?.name || "No category"}
            </span>
            <span className="text-slate-400">•</span>
            <span className="font-medium text-slate-900">
              ₱{Number(form.price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}
            </span>
            <span className="text-slate-400">•</span>
            <span className={form.status === "ACTIVE" ? "text-emerald-700" : "text-slate-500"}>
              {form.status === "ACTIVE" ? "Available" : "Unavailable"}
            </span>
          </div>
        </div>
      </>
    );
  };

  const renderFooter = () => {
    if (step === 1) {
      return (
        <>
          <Button variant="outline" type="button" onClick={handleCloseAttempt}>Cancel</Button>
          <Button variant="secondary" type="button" disabled={!isStep1Valid()} onClick={goToStep2}>Next</Button>
        </>
      );
    } else {
      return (
        <>
          <Button variant="outline" type="button" onClick={goToStep1}>
            <ChevronLeft size={16} /> Back
          </Button>
          <Button
            type="submit"
            form="menu-item-form"
            variant="secondary"
            loading={isSubmitting}
            disabled={isSubmitting || form.recipe.length === 0}
          >
            {isEditing ? "Save Changes" : "Add Item"}
          </Button>
        </>
      );
    }
  };

  const modalTitle = (
    <div className="flex flex-col gap-1">
      <span className="text-lg font-semibold text-slate-900">
        {isEditing ? "Edit Menu Item" : "Add Menu Item"}
      </span>
      <StepIndicator
        currentStep={step}
        totalSteps={2}
        onStepClick={handleStepClick}
        isStep1Valid={isStep1Valid()}
      />
    </div>
  );

  return (
    <>
      <Modal
        open={open}
        onClose={step === 1 ? handleCloseAttempt : undefined}
        title={modalTitle}
        className="max-w-2xl"
        footer={renderFooter()}
      >
        <form
          id="menu-item-form"
          className="space-y-4"
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          noValidate
        >
          {error && (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700" role="alert">
              {error}
            </p>
          )}

          {step === 1 ? renderStep1() : renderStep2()}
        </form>
      </Modal>

      <ConfirmDialog
        open={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        onConfirm={handleDiscard}
        title="Discard changes?"
        description="You have unsaved changes. Are you sure you want to cancel? Your progress will be lost."
        confirmLabel="Discard changes"
        danger
        className="max-w-sm"
      />

      <ConfirmDialog
        open={showSuccessConfirm}
        onClose={handleSuccessConfirm}
        onConfirm={handleSuccessConfirm}
        title={isEditing ? "Item updated!" : "Item added!"}
        description={isEditing
          ? `"${form.name}" has been updated successfully.`
          : `"${form.name}" has been added to the menu.`}
        confirmLabel="OK"
      />
    </>
  );
}

export default MenuItemModal;