import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

// ======================================================
// SUPABASE
// ======================================================

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);

const BUCKET_NAME = "menu-images";

// ======================================================
// COMPONENT
// ======================================================

function MenuManagement() {
  const navigate = useNavigate();

  // ======================================================
  // MENU STATE
  // ======================================================

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  const [imagePreview, setImagePreview] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);

  // ======================================================
  // MENU FORM
  // ======================================================

  const [form, setForm] = useState({
    item_name: "",
    description: "",
    category: "",
    price: "",
    status: "available",
    image_url: "",
  });

  // ======================================================
  // RECIPE / INGREDIENT STATE
  // ======================================================

  const [ingredients, setIngredients] = useState([]);
  const [recipeItems, setRecipeItems] = useState([]);

  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeSaving, setRecipeSaving] = useState(false);
  const [ingredientsLoading, setIngredientsLoading] = useState(false);

  const [recipeForm, setRecipeForm] = useState({
    ingredient_id: "",
    quantity_required: "",
    unit: "",
  });

  // ======================================================
  // SHOW MESSAGE
  // ======================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // ======================================================
  // FETCH MENU ITEMS
  // ======================================================

  const fetchMenuItems = async () => {
    try {
      const response = await api.get("/menu");

      setMenuItems(
        response.data?.menuItems ||
          response.data?.data ||
          []
      );
    } catch (error) {
      console.error("Error loading menu items:", error);

      showMessage(
        error.response?.data?.message ||
          "Unable to load menu items.",
        "error"
      );
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // ======================================================
  // FETCH INGREDIENTS FROM SUPABASE
  // ======================================================

  const fetchIngredients = async () => {
    try {
      setIngredientsLoading(true);

      const { data, error } = await supabase
        .from("ingredients")
        .select("id, ingredient_name, unit")
        .order("ingredient_name", {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      const formattedIngredients = (data || [])
        .map((ingredient) => ({
          id: ingredient.id,
          ingredient_name:
            ingredient.ingredient_name || "",
          unit: ingredient.unit || "",
        }))
        .filter(
          (ingredient) =>
            ingredient.id &&
            ingredient.ingredient_name
        );

      setIngredients(formattedIngredients);

      if (formattedIngredients.length === 0) {
        showMessage(
          "No ingredients found in the ingredients table.",
          "error"
        );
      }
    } catch (error) {
      console.error(
        "Error loading ingredients:",
        error
      );

      setIngredients([]);

      showMessage(
        error.message ||
          "Unable to load ingredients.",
        "error"
      );
    } finally {
      setIngredientsLoading(false);
    }
  };

  // ======================================================
  // FETCH RECIPE
  // ======================================================

  const fetchRecipe = async (menuItemId) => {
    if (!menuItemId) {
      setRecipeItems([]);
      return;
    }

    try {
      setRecipeLoading(true);

      const response = await api.get(
        `/menu/${menuItemId}/recipe`
      );

      const items =
        response.data?.recipeItems ||
        response.data?.data ||
        [];

      setRecipeItems(items);
    } catch (error) {
      console.error(
        "Error loading recipe:",
        error
      );

      setRecipeItems([]);

      showMessage(
        error.response?.data?.message ||
          "Unable to load recipe.",
        "error"
      );
    } finally {
      setRecipeLoading(false);
    }
  };

  // ======================================================
  // MENU INPUT
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ======================================================
  // RESET MENU FORM
  // ======================================================

  const resetMenuForm = () => {
    setForm({
      item_name: "",
      description: "",
      category: "",
      price: "",
      status: "available",
      image_url: "",
    });

    setSelectedImage(null);
    setImagePreview("");

    setRecipeItems([]);

    setRecipeForm({
      ingredient_id: "",
      quantity_required: "",
      unit: "",
    });

    setEditingId(null);
  };

  // ======================================================
  // OPEN ADD MODAL
  // ======================================================

  const handleAdd = async () => {
    resetMenuForm();

    setMessage("");
    setShowModal(true);

    await fetchIngredients();
  };

  // ======================================================
  // OPEN EDIT MODAL
  // ======================================================

  const handleEdit = async (item) => {
    setEditingId(item.id);

    setForm({
      item_name: item.item_name || "",
      description: item.description || "",
      category: item.category || "",
      price: item.price ?? "",
      status: item.status || "available",
      image_url: item.image_url || "",
    });

    setSelectedImage(null);
    setImagePreview(item.image_url || "");

    setRecipeItems([]);

    setRecipeForm({
      ingredient_id: "",
      quantity_required: "",
      unit: "",
    });

    setMessage("");
    setShowModal(true);

    await fetchIngredients();
  };

  // ======================================================
  // LOAD RECIPE AFTER EDITING
  // ======================================================

  useEffect(() => {
    if (
      showModal &&
      editingId &&
      ingredients.length > 0
    ) {
      fetchRecipe(editingId);
    }
  }, [showModal, editingId, ingredients]);

  // ======================================================
  // HANDLE IMAGE SELECT
  // ======================================================

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      showMessage(
        "Please select a valid image file.",
        "error"
      );

      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        "Image must be smaller than 5MB.",
        "error"
      );

      e.target.value = "";
      return;
    }

    setSelectedImage(file);

    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
  };

  // ======================================================
  // UPLOAD IMAGE
  // ======================================================

  const uploadImage = async () => {
    if (!selectedImage) {
      return form.image_url || null;
    }

    try {
      setUploading(true);

      const fileExtension =
        selectedImage.name.split(".").pop();

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const filePath = `menu/${fileName}`;

      const { error: uploadError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(
            filePath,
            selectedImage,
            {
              cacheControl: "3600",
              upsert: false,
            }
          );

      if (uploadError) {
        throw uploadError;
      }

      const { data } =
        supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error(
          "Unable to get image public URL."
        );
      }

      return data.publicUrl;
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      throw new Error(
        error.message ||
          "Failed to upload image."
      );
    } finally {
      setUploading(false);
    }
  };

  // ======================================================
  // RECIPE FORM CHANGE
  // ======================================================

  const handleRecipeChange = (e) => {
    const { name, value } = e.target;

    if (name === "ingredient_id") {
      const ingredient = ingredients.find(
        (item) =>
          String(item.id) === String(value)
      );

      setRecipeForm((previous) => ({
        ...previous,
        ingredient_id: value,
        unit: ingredient?.unit || "",
      }));

      return;
    }

    setRecipeForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ======================================================
  // ADD INGREDIENT TO LOCAL RECIPE
  // ======================================================

  const addRecipeIngredient = () => {
    if (!recipeForm.ingredient_id) {
      showMessage(
        "Please select an ingredient.",
        "error"
      );
      return;
    }

    const quantity = Number(
      recipeForm.quantity_required
    );

    if (
      recipeForm.quantity_required === "" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      showMessage(
        "Please enter a quantity greater than 0.",
        "error"
      );
      return;
    }

    const selectedIngredient =
      ingredients.find(
        (ingredient) =>
          String(ingredient.id) ===
          String(recipeForm.ingredient_id)
      );

    if (!selectedIngredient) {
      showMessage(
        "Selected ingredient was not found.",
        "error"
      );
      return;
    }

    // Prevent duplicate ingredients
    const alreadyExists = recipeItems.some(
      (recipe) =>
        Number(recipe.ingredient_id) ===
        Number(recipeForm.ingredient_id)
    );

    if (alreadyExists) {
      showMessage(
        `${selectedIngredient.ingredient_name} is already in this recipe.`,
        "error"
      );
      return;
    }

    const newRecipeItem = {
      id: `temp-${Date.now()}-${Math.random()}`,
      ingredient_id: Number(
        recipeForm.ingredient_id
      ),
      ingredient_name:
        selectedIngredient.ingredient_name,
      quantity_required: quantity,
      unit: selectedIngredient.unit || "",
    };

    setRecipeItems((previous) => [
      ...previous,
      newRecipeItem,
    ]);

    setRecipeForm({
      ingredient_id: "",
      quantity_required: "",
      unit: "",
    });
  };

  // ======================================================
  // REMOVE INGREDIENT
  // ======================================================

  const removeRecipeIngredient = (recipeId) => {
    setRecipeItems((previous) =>
      previous.filter(
        (recipe) => recipe.id !== recipeId
      )
    );
  };

  // ======================================================
  // SAVE RECIPE
  // ======================================================

  const saveRecipe = async (menuItemId) => {
    if (!menuItemId) {
      throw new Error(
        "Menu item ID is missing. Recipe cannot be saved."
      );
    }

    const recipeData = recipeItems.map(
      (recipe) => ({
        ingredient_id: Number(
          recipe.ingredient_id
        ),
        quantity_required: Number(
          recipe.quantity_required
        ),
      })
    );

    try {
      const response = await api.put(
        `/menu/${menuItemId}/recipe`,
        {
          recipeItems: recipeData,
        }
      );

      setRecipeItems(
        response.data?.recipeItems ||
          response.data?.data ||
          recipeItems
      );

      return response.data;
    } catch (error) {
      console.error(
        "SAVE RECIPE ERROR:",
        error
      );

      throw new Error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save recipe."
      );
    }
  };

  // ======================================================
  // CREATE / UPDATE MENU ITEM
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!form.item_name.trim()) {
      showMessage(
        "Item name is required.",
        "error"
      );
      return;
    }

    if (!form.category.trim()) {
      showMessage(
        "Category is required.",
        "error"
      );
      return;
    }

    const price = Number(form.price);

    if (
      form.price === "" ||
      !Number.isFinite(price) ||
      price < 0
    ) {
      showMessage(
        "Please enter a valid price.",
        "error"
      );
      return;
    }

    try {
      setLoading(true);

      // --------------------------------------------------
      // IMAGE
      // --------------------------------------------------

      let imageUrl = form.image_url || null;

      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      // --------------------------------------------------
      // MENU DATA
      // --------------------------------------------------

      const menuData = {
        item_name: form.item_name.trim(),

        description:
          form.description.trim() || null,

        category: form.category.trim(),

        price: price,

        status: form.status,

        image_url: imageUrl,
      };

      let menuItemId = editingId;

      // --------------------------------------------------
      // UPDATE
      // --------------------------------------------------

      if (editingId) {
        await api.put(
          `/menu/${editingId}`,
          menuData
        );
      }

      // --------------------------------------------------
      // CREATE
      // --------------------------------------------------

      else {
        const response = await api.post(
          "/menu",
          menuData
        );

        menuItemId =
          response.data?.menuItem?.id ||
          response.data?.menuItemId ||
          response.data?.id ||
          response.data?.data?.id;
      }

      // --------------------------------------------------
      // FALLBACK: GET CREATED ITEM
      // --------------------------------------------------

      if (!menuItemId) {
        const menuResponse =
          await api.get("/menu");

        const createdItem =
          (
            menuResponse.data?.menuItems ||
            menuResponse.data?.data ||
            []
          ).find(
            (item) =>
              item.item_name ===
              menuData.item_name
          );

        menuItemId = createdItem?.id;
      }

      if (!menuItemId) {
        throw new Error(
          "Menu item was saved, but its ID could not be found."
        );
      }

      // --------------------------------------------------
      // SAVE RECIPE
      // --------------------------------------------------

      setRecipeSaving(true);

      await saveRecipe(menuItemId);

      setRecipeSaving(false);

      // --------------------------------------------------
      // SUCCESS
      // --------------------------------------------------

      showMessage(
        editingId
          ? "Menu item and recipe updated successfully!"
          : "Menu item and recipe added successfully!",
        "success"
      );

      setShowModal(false);

      resetMenuForm();

      await fetchMenuItems();
    } catch (error) {
      console.error(
        "MENU SAVE ERROR:",
        error
      );

      setRecipeSaving(false);

      showMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to save menu item.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // DELETE MENU ITEM
  // ======================================================

  const handleDelete = (item) => {
    setDeleteItem(item);
    setShowDeleteModal(true);
  };

  // ======================================================
  // CANCEL DELETE
  // ======================================================

  const cancelDelete = () => {
    if (deleting) {
      return;
    }

    setShowDeleteModal(false);
    setDeleteItem(null);
  };

  // ======================================================
  // CONFIRM DELETE
  // ======================================================

  const confirmDelete = async () => {
    if (!deleteItem) {
      return;
    }

    try {
      setDeleting(true);

      await api.delete(
        `/menu/${deleteItem.id}`
      );

      showMessage(
        "Menu item and recipe deleted successfully!",
        "success"
      );

      setShowDeleteModal(false);
      setDeleteItem(null);

      await fetchMenuItems();
    } catch (error) {
      console.error(
        "DELETE ERROR:",
        error
      );

      showMessage(
        error.response?.data?.message ||
          error.message ||
          "Unable to delete menu item.",
        "error"
      );
    } finally {
      setDeleting(false);
    }
  };

  // ======================================================
  // CLOSE MENU MODAL
  // ======================================================

  const handleCancel = () => {
    if (
      loading ||
      uploading ||
      recipeSaving
    ) {
      return;
    }

    setShowModal(false);
    resetMenuForm();
    setMessage("");
  };

  // ======================================================
  // SEARCH
  // ======================================================

  const filteredItems = menuItems.filter(
    (item) => {
      const searchText =
        search.toLowerCase();

      return (
        item.item_name
          ?.toLowerCase()
          .includes(searchText) ||
        item.category
          ?.toLowerCase()
          .includes(searchText)
      );
    }
  );

  // ======================================================
  // RETURN
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <div className="sticky top-0 h-screen self-start">
        <Sidebar />
      </div>

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="flex-1 p-8 overflow-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              Menu Management
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your café menu items,
              recipes, ingredients, prices,
              images, and availability.
            </p>
          </div>

          <button
            onClick={handleAdd}
            className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            + Add Menu Item
          </button>

        </div>

        {/* MESSAGE */}

        {message && (
          <div
            className={`rounded-lg p-4 mb-6 border ${
              messageType === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-green-50 border-green-200 text-green-700"
            }`}
          >
            {message}
          </div>
        )}

               {/* ==================================================
            MENU TABLE
        ================================================== */}

        <div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">

          {/* Sticky header: title + search */}

          <div className="sticky top-0 z-20 bg-white p-6 border-b border-gray-300">

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">

              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Menu Items
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {filteredItems.length} menu item
                  {filteredItems.length !== 1
                    ? "s"
                    : ""}
                </p>
              </div>

              {/* SEARCH BAR */}

              <div className="relative w-full md:w-80">

                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  🔍
                </span>

                <input
                  type="text"
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by item name or category..."
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

              </div>

            </div>

          </div>

          <div className="max-h-[500px] overflow-y-auto overflow-x-auto">

            <table className="w-full table-fixed">

              <colgroup>
                <col className="w-[100px]" />
                <col className="w-[180px]" />
                <col className="w-[130px]" />
                <col className="w-[300px]" />
                <col className="w-[120px]" />
                <col className="w-[130px]" />
                <col className="w-[180px]" />
              </colgroup>

              <thead className="bg-gray-50 sticky top-0 z-10">

                <tr>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Image
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Item Name
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Category
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Description
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Price
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Status
                  </th>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredItems.length === 0 ? (

                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      {search
                        ? "No matching menu items found."
                        : "No menu items found."}
                    </td>
                  </tr>

                ) : (

                  filteredItems.map((item) => (

                    <tr
                      key={item.id}
                      className="border-t border-gray-200 hover:bg-gray-50 transition"
                    >

                      {/* IMAGE */}

                      <td className="px-6 py-4">

                        {item.image_url ? (

                          <img
                            src={item.image_url}
                            alt={item.item_name}
                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                          />

                        ) : (

                          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 text-xs text-center">
                            No Image
                          </div>

                        )}

                      </td>

                      {/* ITEM NAME */}

                      <td className="px-6 py-4">

                        <div
                          className="font-semibold text-gray-800 truncate"
                          title={item.item_name}
                        >
                          {item.item_name}
                        </div>

                      </td>

                      {/* CATEGORY */}

                      <td className="px-6 py-4">

                        <span
                          className="text-gray-600 truncate block"
                          title={item.category}
                        >
                          {item.category}
                        </span>

                      </td>

                      {/* DESCRIPTION */}

                      <td className="px-6 py-4 align-top">

                        <div
                          className="text-gray-600 text-sm leading-5 break-words whitespace-normal overflow-hidden line-clamp-2"
                          title={item.description || ""}
                        >
                          {item.description ||
                            "No description"}
                        </div>

                      </td>

                      {/* PRICE */}

                      <td className="px-6 py-4">

                        <span className="font-semibold text-gray-800 whitespace-nowrap">
                          ₱
                          {Number(
                            item.price
                          ).toFixed(2)}
                        </span>

                      </td>

                      {/* STATUS */}

                      <td className="px-6 py-4">

                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                            item.status ===
                            "available"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {item.status}
                        </span>

                      </td>

                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex items-center gap-2 flex-wrap">

                          <button
                            onClick={() =>
                              handleEdit(item)
                            }
                            className="px-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg text-sm font-medium whitespace-nowrap transition"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(item)
                            }
                            className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-medium whitespace-nowrap transition"
                          >
                            Delete
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>
      </main>

      {/* ==================================================
          ADD / EDIT MODAL
      ================================================== */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[92vh] overflow-y-auto">

            {/* MODAL HEADER */}

            <div className="flex items-center justify-between p-6 border-b">

              <div>

                <h2 className="text-2xl font-bold text-gray-800">
                  {editingId
                    ? "Edit Menu Item"
                    : "Add Menu Item"}
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {editingId
                    ? "Update the menu item, ingredients, and recipe."
                    : "Add a new menu item and its ingredients."}
                </p>

              </div>

              <button
                type="button"
                onClick={handleCancel}
                disabled={
                  loading ||
                  uploading ||
                  recipeSaving
                }
                className="text-gray-400 hover:text-gray-700 text-2xl disabled:opacity-50"
              >
                ×
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              {/* ==================================================
                  BASIC INFORMATION
              ================================================== */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* ITEM NAME */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>

                  <input
                    type="text"
                    name="item_name"
                    value={form.item_name}
                    onChange={handleChange}
                    placeholder="Example: Iced Latte"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    required
                  />

                </div>

                {/* CATEGORY */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>

                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    required
                  >

                    <option value="">
                      Select category
                    </option>

                    <option value="Coffee">
                      Coffee
                    </option>

                    <option value="Non-Coffee">
                      Non-Coffee
                    </option>

                    <option value="Tea">
                      Tea
                    </option>

                    <option value="Pastries">
                      Pastries
                    </option>

                    <option value="Meals">
                      Meals
                    </option>

                    <option value="Desserts">
                      Desserts
                    </option>

                    <option value="Others">
                      Others
                    </option>

                  </select>

                </div>

                {/* PRICE */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price *
                  </label>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                    required
                  />

                </div>

                {/* STATUS */}

                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>

                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  >

                    <option value="available">
                      Available
                    </option>

                    <option value="unavailable">
                      Unavailable
                    </option>

                  </select>

                </div>

                {/* DESCRIPTION */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>

                  <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Describe the menu item..."
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />

                </div>

                {/* IMAGE */}

                <div className="md:col-span-2">

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menu Image
                  </label>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 bg-white"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    JPG, PNG, WEBP, or other
                    image files. Maximum 5MB.
                  </p>

                </div>

                {/* IMAGE PREVIEW */}

                {imagePreview && (

                  <div className="md:col-span-2">

                    <p className="text-sm font-medium text-gray-700 mb-2">
                      Image Preview
                    </p>

                    <div className="relative w-full h-64 bg-gray-100 rounded-xl overflow-hidden border">

                      <img
                        src={imagePreview}
                        alt="Menu preview"
                        className="w-full h-full object-contain"
                      />

                    </div>

                  </div>

                )}

              </div>

              {/* ==================================================
                  RECIPE / INGREDIENTS
              ================================================== */}

              <div className="mt-8 pt-6 border-t border-gray-200">

                <div className="mb-5">

                  <h3 className="text-xl font-bold text-gray-800">
                    Recipe / Ingredients
                  </h3>

                  <p className="text-sm text-gray-500 mt-1">
                    Add the ingredients and amount
                    needed to prepare one serving.
                  </p>

                </div>

                {/* ADD INGREDIENT */}

                <div className="bg-pink-50 border border-pink-100 rounded-xl p-5">

                  <h4 className="text-lg font-semibold text-gray-800 mb-1">
                    Add Ingredient
                  </h4>

                  <p className="text-sm text-gray-500 mb-4">
                    Select an ingredient and specify
                    the quantity used for one serving.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* INGREDIENT */}

                    <div>

                      <label
                        htmlFor="recipe-ingredient"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Ingredient *

                        {!ingredientsLoading && (
                          <span className="ml-2 text-xs font-normal text-gray-500">
                            ({ingredients.length} available)
                          </span>
                        )}

                      </label>

                      <select
                        id="recipe-ingredient"
                        name="ingredient_id"
                        value={
                          recipeForm.ingredient_id
                        }
                        onChange={
                          handleRecipeChange
                        }
                        disabled={
                          ingredientsLoading ||
                          recipeSaving
                        }
                        className="w-full border border-gray-300 bg-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      >

                        <option value="">
                          {ingredientsLoading
                            ? "Loading ingredients..."
                            : ingredients.length === 0
                            ? "No ingredients available"
                            : "Select ingredient"}
                        </option>

                        {ingredients.map(
                          (ingredient) => (

                            <option
                              key={ingredient.id}
                              value={ingredient.id}
                            >
                              {
                                ingredient.ingredient_name
                              }

                              {ingredient.unit
                                ? ` (${ingredient.unit})`
                                : ""}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                    {/* QUANTITY */}

                    <div>

                      <label
                        htmlFor="recipe-quantity"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Quantity *
                      </label>

                      <input
                        id="recipe-quantity"
                        type="number"
                        name="quantity_required"
                        value={
                          recipeForm.quantity_required
                        }
                        onChange={
                          handleRecipeChange
                        }
                        min="0"
                        step="0.01"
                        placeholder="Example: 0.20"
                        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                      />

                    </div>

                    {/* UNIT */}

                    <div>

                      <label
                        htmlFor="recipe-unit"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Unit
                      </label>

                      <input
                        id="recipe-unit"
                        type="text"
                        name="unit"
                        value={recipeForm.unit}
                        readOnly
                        placeholder="Unit"
                        className="w-full border border-gray-300 bg-gray-100 rounded-lg px-4 py-3 text-gray-600"
                      />

                    </div>

                  </div>

                  <button
                    type="button"
                    onClick={addRecipeIngredient}
                    disabled={
                      ingredientsLoading ||
                      recipeLoading ||
                      recipeSaving
                    }
                    className="mt-4 px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition disabled:opacity-50"
                  >
                    + Add Ingredient
                  </button>

                </div>

                {/* ==================================================
                    CURRENT RECIPE
                ================================================== */}

                <div className="mt-6">

                  <div className="flex items-center justify-between mb-4">

                    <div>

                      <h4 className="text-lg font-semibold text-gray-800">
                        Current Recipe
                      </h4>

                      <p className="text-sm text-gray-500">
                        Ingredients required for one
                        serving.
                      </p>

                    </div>

                    <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-700 text-sm font-medium">
                      {recipeItems.length} ingredient
                      {recipeItems.length !== 1
                        ? "s"
                        : ""}
                    </span>

                  </div>

                  {/* LOADING */}

                  {recipeLoading ? (

                    <div className="py-10 text-center text-gray-400">
                      Loading recipe...
                    </div>

                  ) : recipeItems.length === 0 ? (

                    <div className="border border-dashed border-gray-300 rounded-xl p-10 text-center">

                      <div className="text-4xl mb-3">
                        🧾
                      </div>

                      <p className="font-medium text-gray-600">
                        No ingredients added yet.
                      </p>

                      <p className="text-sm text-gray-400 mt-1">
                        Add ingredients above to
                        create the recipe.
                      </p>

                    </div>

                  ) : (

                    <div className="border border-gray-200 rounded-xl overflow-hidden">

                      <div className="overflow-x-auto">

                        <table className="w-full">

                          <thead className="bg-gray-50">

                            <tr>

                              <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">
                                Ingredient
                              </th>

                              <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">
                                Quantity
                              </th>

                              <th className="text-left px-5 py-3 text-sm font-semibold text-gray-600">
                                Unit
                              </th>

                              <th className="text-right px-5 py-3 text-sm font-semibold text-gray-600">
                                Action
                              </th>

                            </tr>

                          </thead>

                          <tbody>

                            {recipeItems.map(
                              (recipe) => (

                                <tr
                                  key={recipe.id}
                                  className="border-t border-gray-200"
                                >

                                  {/* INGREDIENT */}

                                  <td className="px-5 py-4">

                                    <span className="font-medium text-gray-800">
                                      {recipe.ingredient_name ||
                                        recipe.ingredients?.ingredient_name ||
                                        "Unknown ingredient"}
                                    </span>

                                  </td>

                                  {/* QUANTITY */}

                                  <td className="px-5 py-4">

                                    <span className="font-semibold text-gray-700">
                                      {Number(
                                        recipe.quantity_required
                                      ).toFixed(2)}
                                    </span>

                                  </td>

                                  {/* UNIT */}

                                  <td className="px-5 py-4 text-gray-500">
                                    {recipe.unit ||
                                      recipe.ingredients?.unit ||
                                      ""}
                                  </td>

                                  {/* ACTION */}

                                  <td className="px-5 py-4 text-right">

                                    <button
                                      type="button"
                                      onClick={() =>
                                        removeRecipeIngredient(
                                          recipe.id
                                        )
                                      }
                                      disabled={
                                        recipeSaving
                                      }
                                      className="text-red-500 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                                    >
                                      Remove
                                    </button>

                                  </td>

                                </tr>

                              )
                            )}

                          </tbody>

                        </table>

                      </div>

                    </div>

                  )}

                </div>

              </div>

              {/* ==================================================
                  FOOTER
              ================================================== */}

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={
                    loading ||
                    uploading ||
                    recipeSaving
                  }
                  className="px-5 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    loading ||
                    uploading ||
                    recipeSaving
                  }
                  className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >

                  {uploading
                    ? "Uploading Image..."
                    : recipeSaving
                    ? "Saving Recipe..."
                    : loading
                    ? editingId
                      ? "Updating..."
                      : "Saving..."
                    : editingId
                    ? "Update Menu Item"
                    : "Save Menu Item"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ==================================================
          DELETE MODAL
      ================================================== */}

      {showDeleteModal && deleteItem && (

        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">

          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">

            <div className="p-6 text-center">

              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">

                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >

                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m0 3.75h.008M10.29 3.86l-7.36 12.75A1.5 1.5 0 004.23 19h15.54a1.5 1.5 0 001.3-2.25L13.71 3.86a1.5 1.5 0 00-2.6 0z"
                  />

                </svg>

              </div>

              <h2 className="text-xl font-bold text-gray-800">
                Delete Menu Item?
              </h2>

              <p className="text-gray-500 text-sm mt-2">
                Are you sure you want to delete
                this menu item?
              </p>

              <div className="mt-4 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">

                <p className="font-semibold text-gray-800">
                  {deleteItem.item_name}
                </p>

                {deleteItem.category && (

                  <p className="text-sm text-gray-500 mt-1">
                    {deleteItem.category}
                  </p>

                )}

              </div>

              <p className="text-xs text-red-500 mt-4">
                This action cannot be undone.
              </p>

            </div>

            <div className="flex justify-end gap-3 px-6 py-4 bg-gray-50 border-t border-gray-200">

              <button
                type="button"
                onClick={cancelDelete}
                disabled={deleting}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-600 font-medium hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={deleting}
                className="px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting
                  ? "Deleting..."
                  : "Yes, Delete"}
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default MenuManagement;