import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
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
  // STATE
  // ======================================================

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [menuItems, setMenuItems] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [loading, setLoading] = useState(false);

  const [uploading, setUploading] = useState(false);

  const [message, setMessage] = useState("");

  const [messageType, setMessageType] = useState("success");

  const [imagePreview, setImagePreview] = useState("");

  const [selectedImage, setSelectedImage] = useState(null);

  const [form, setForm] = useState({
    item_name: "",
    description: "",
    category: "",
    price: "",
    status: "available",
    image_url: "",
  });

  // ======================================================
  // FETCH MENU ITEMS
  // ======================================================

  const fetchMenuItems = async () => {
    try {
      const response = await api.get("/menu");

      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error("Error loading menu items:", error);

      showMessage(
        "Unable to load menu items.",
        "error"
      );
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // ======================================================
  // MESSAGE
  // ======================================================

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
    }, 4000);
  };

  // ======================================================
  // HANDLE INPUT
  // ======================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // ======================================================
  // OPEN ADD MODAL
  // ======================================================

  const handleAdd = () => {
    setEditingId(null);

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

    setMessage("");

    setShowModal(true);
  };

  // ======================================================
  // OPEN EDIT MODAL
  // ======================================================

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      item_name: item.item_name || "",
      description: item.description || "",
      category: item.category || "",
      price: item.price || "",
      status: item.status || "available",
      image_url: item.image_url || "",
    });

    setSelectedImage(null);

    setImagePreview(item.image_url || "");

    setMessage("");

    setShowModal(true);
  };

  // ======================================================
  // HANDLE IMAGE SELECT
  // ======================================================

  const handleImageChange = (e) => {
    const file = e.target.files[0];

    if (!file) {
      return;
    }

    // ----------------------------------------------------
    // CHECK FILE TYPE
    // ----------------------------------------------------

    if (!file.type.startsWith("image/")) {
      showMessage(
        "Please select a valid image file.",
        "error"
      );

      e.target.value = "";
      return;
    }

    // ----------------------------------------------------
    // CHECK FILE SIZE
    // Maximum 5MB
    // ----------------------------------------------------

    if (file.size > 5 * 1024 * 1024) {
      showMessage(
        "Image must be smaller than 5MB.",
        "error"
      );

      e.target.value = "";
      return;
    }

    setSelectedImage(file);

    // ----------------------------------------------------
    // IMAGE PREVIEW
    // ----------------------------------------------------

    const previewUrl = URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  // ======================================================
  // UPLOAD IMAGE TO SUPABASE
  // ======================================================

  const uploadImage = async () => {
    if (!selectedImage) {
      return form.image_url || null;
    }

    try {
      setUploading(true);

      // --------------------------------------------------
      // CREATE UNIQUE FILE NAME
      // --------------------------------------------------

      const fileExtension =
        selectedImage.name.split(".").pop();

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExtension}`;

      const filePath = `menu/${fileName}`;

      // --------------------------------------------------
      // UPLOAD
      // --------------------------------------------------

      const { error: uploadError } =
        await supabase.storage
          .from(BUCKET_NAME)
          .upload(filePath, selectedImage, {
            cacheControl: "3600",
            upsert: false,
          });

      if (uploadError) {
        console.error(
          "Supabase image upload error:",
          uploadError
        );

        throw uploadError;
      }

      // --------------------------------------------------
      // GET PUBLIC URL
      // --------------------------------------------------

      const { data } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      if (!data?.publicUrl) {
        throw new Error(
          "Unable to get image public URL."
        );
      }

      return data.publicUrl;
    } catch (error) {
      console.error("Image upload error:", error);

      throw new Error(
        "Failed to upload image."
      );
    } finally {
      setUploading(false);
    }
  };

  // ======================================================
  // CREATE / UPDATE MENU ITEM
  // ======================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ----------------------------------------------------
    // BASIC VALIDATION
    // ----------------------------------------------------

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

    if (
      form.price === "" ||
      Number(form.price) < 0 ||
      !Number.isFinite(Number(form.price))
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
      // UPLOAD IMAGE ONLY IF NEW IMAGE SELECTED
      // --------------------------------------------------

      let imageUrl = form.image_url || null;

      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      // --------------------------------------------------
      // DATA SENT TO BACKEND
      // --------------------------------------------------

      const menuData = {
        item_name: form.item_name.trim(),
        description:
          form.description.trim() || null,
        category: form.category.trim(),
        price: Number(form.price),
        status: form.status,
        image_url: imageUrl,
      };

      console.log(
        "MENU DATA:",
        menuData
      );

      // --------------------------------------------------
      // UPDATE
      // --------------------------------------------------

      if (editingId) {
        const response = await api.put(
          `/menu/${editingId}`,
          menuData
        );

        console.log(
          "UPDATE RESPONSE:",
          response.data
        );

        showMessage(
          "Menu item updated successfully!",
          "success"
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

        console.log(
          "CREATE RESPONSE:",
          response.data
        );

        showMessage(
          "Menu item added successfully!",
          "success"
        );
      }

      // --------------------------------------------------
      // CLOSE MODAL
      // --------------------------------------------------

      setShowModal(false);

      setEditingId(null);

      setSelectedImage(null);

      setImagePreview("");

      setForm({
        item_name: "",
        description: "",
        category: "",
        price: "",
        status: "available",
        image_url: "",
      });

      // --------------------------------------------------
      // REFRESH MENU
      // --------------------------------------------------

      await fetchMenuItems();

    } catch (error) {
      console.error(
        "MENU SAVE ERROR:",
        error
      );

      console.error(
        "SERVER RESPONSE:",
        error.response?.data
      );

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
  // DELETE
  // ======================================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this menu item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setLoading(true);

      await api.delete(`/menu/${id}`);

      showMessage(
        "Menu item deleted successfully!",
        "success"
      );

      await fetchMenuItems();

    } catch (error) {
      console.error(
        "DELETE ERROR:",
        error
      );

      showMessage(
        error.response?.data?.message ||
          "Unable to delete menu item.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // CLOSE MODAL
  // ======================================================

  const handleCancel = () => {
    if (loading || uploading) {
      return;
    }

    setShowModal(false);

    setEditingId(null);

    setSelectedImage(null);

    setImagePreview("");

    setForm({
      item_name: "",
      description: "",
      category: "",
      price: "",
      status: "available",
      image_url: "",
    });

    setMessage("");
  };

  // ======================================================
  // SEARCH
  // ======================================================

  const filteredItems = menuItems.filter((item) => {
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
  });

  // ======================================================
  // LOGOUT
  // ======================================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  // ======================================================
  // RETURN
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside className="w-64 bg-white border-r border-gray-300 min-h-screen flex flex-col">

        {/* BRAND */}

        <div className="p-6 border-b border-gray-300">
          <h1 className="text-2xl font-bold text-pink-500">
            Taste It Café
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Café Management System
          </p>
        </div>

        {/* NAVIGATION */}

        <nav className="flex-1 p-4">

          <p className="text-xs font-semibold text-gray-400 uppercase px-3 mb-3">
            Main Menu
          </p>

          {/* DASHBOARD */}

          <button
            onClick={() =>
              navigate("/dashboard")
            }
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Dashboard
          </button>

          {/* MENU */}

          <button
            onClick={() =>
              navigate("/menu")
            }
            className="w-full text-left px-4 py-3 rounded-lg bg-pink-100 text-pink-600 font-semibold mb-1"
          >
            Menu Management
          </button>

          {/* INVENTORY */}

          <button
            onClick={() =>
              navigate("/inventory")
            }
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Inventory Management
          </button>

          {/* SALES */}

          <button
            onClick={() =>
              navigate("/sales")
            }
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Sales
          </button>

          {/* REPORTS */}

          <button
            onClick={() =>
              navigate("/reports")
            }
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Reports
          </button>

          {/* SETTINGS */}

          <button
            onClick={() =>
              navigate("/settings")
            }
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Settings
          </button>

        </nav>

        {/* LOGOUT */}

        <div className="p-4 border-t border-gray-300">

          <button
            onClick={handleLogout}
            className="w-full text-left px-4 py-3 rounded-lg text-red-500 hover:bg-red-50 transition"
          >
            Log Out
          </button>

        </div>

      </aside>

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
              Manage your café menu items, prices,
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
            SEARCH
        ================================================== */}

        <div className="bg-white rounded-xl shadow-sm border p-5 mb-6">

          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search Menu
          </label>

          <input
            type="text"
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
            placeholder="Search by item name or category..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

        </div>

       
{/* ==========================================
    MENU TABLE
========================================== */}
<div className="bg-white rounded-xl shadow-sm border border-gray-300 overflow-hidden">

  {/* TABLE HEADER */}
  <div className="p-6 border-b border-gray-300">
    <h2 className="text-lg font-semibold text-gray-800">
      Menu Items
    </h2>

    <p className="text-sm text-gray-500 mt-1">
      {filteredItems.length} menu item
      {filteredItems.length !== 1 ? "s" : ""}
    </p>
  </div>

  {/* TABLE */}
  <div className="overflow-x-auto">
    <table className="w-full table-fixed">

      {/* COLUMN WIDTHS */}
      <colgroup>
        <col className="w-[100px]" />   {/* Image */}
        <col className="w-[180px]" />   {/* Item Name */}
        <col className="w-[130px]" />   {/* Category */}
        <col className="w-[320px]" />   {/* Description */}
        <col className="w-[120px]" />   {/* Price */}
        <col className="w-[130px]" />   {/* Status */}
        <col className="w-[180px]" />   {/* Actions */}
      </colgroup>

      {/* HEADER */}
      <thead className="bg-gray-50">
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

      {/* BODY */}
      <tbody>

        {filteredItems.length === 0 ? (

          <tr>
            <td
              colSpan="7"
              className="px-6 py-12 text-center text-gray-400"
            >
              No menu items found.
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
                  className="
                    text-gray-600
                    text-sm
                    leading-5
                    break-words
                    whitespace-normal
                    overflow-hidden
                    line-clamp-2
                  "
                  title={item.description || ""}
                >
                  {item.description || "No description"}
                </div>
              </td>

              {/* PRICE */}
              <td className="px-6 py-4">
                <span className="font-semibold text-gray-800 whitespace-nowrap">
                  ₱{Number(item.price).toFixed(2)}
                </span>
              </td>

              {/* STATUS */}
              <td className="px-6 py-4">
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap ${
                    item.status === "available"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {item.status}
                </span>
              </td>

              {/* ACTIONS */}
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">

                  <button
                    onClick={() => handleEdit(item)}
                    className="
                      px-3 py-2
                      bg-blue-100
                      text-blue-600
                      hover:bg-blue-200
                      rounded-lg
                      text-sm
                      font-medium
                      whitespace-nowrap
                    "
                  >
                    Edit
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="
                      px-3 py-2
                      bg-red-100
                      text-red-600
                      hover:bg-red-200
                      rounded-lg
                      text-sm
                      font-medium
                      whitespace-nowrap
                    "
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

          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">

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
                    ? "Update the menu item information."
                    : "Add a new item to your café menu."}
                </p>

              </div>

              <button
                type="button"
                onClick={handleCancel}
                disabled={loading || uploading}
                className="text-gray-400 hover:text-gray-700 text-2xl"
              >
                ×
              </button>

            </div>

            {/* MODAL FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

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
                    JPG, PNG, WEBP, or other image files.
                    Maximum 5MB.
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

              {/* MODAL FOOTER */}

              <div className="flex justify-end gap-3 mt-8 pt-5 border-t">

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={loading || uploading}
                  className="px-5 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={loading || uploading}
                  className="px-6 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold disabled:opacity-50"
                >

                  {uploading
                    ? "Uploading Image..."
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

    </div>
  );
}


export default MenuManagement;