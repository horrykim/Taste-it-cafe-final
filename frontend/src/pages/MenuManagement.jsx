import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function MenuManagement() {
  const navigate = useNavigate();

  // ==========================================
  // STATE
  // ==========================================

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [menuItems, setMenuItems] = useState([]);

  const [editingId, setEditingId] = useState(null);

  const [form, setForm] = useState({
    item_name: "",
    description: "",
    price: "",
    status: "available",
  });

  const [message, setMessage] = useState("");

  // ==========================================
  // GET MENU ITEMS
  // ==========================================

  const fetchMenuItems = async () => {
    try {
      const response = await api.get("/menu");

      setMenuItems(response.data.menuItems || []);
    } catch (error) {
      console.error("Error loading menu items:", error);

      setMessage("Unable to load menu items.");
    }
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm({
      ...form,
      [name]: value,
    });
  };

  // ==========================================
  // OPEN ADD FORM
  // ==========================================

  const handleAdd = () => {
    setEditingId(null);

    setForm({
      item_name: "",
      description: "",
      price: "",
      status: "available",
    });

    setMessage("");
    setShowForm(true);
  };

  // ==========================================
  // OPEN EDIT FORM
  // ==========================================

  const handleEdit = (item) => {
    setEditingId(item.id);

    setForm({
      item_name: item.item_name,
      description: item.description || "",
      price: item.price,
      status: item.status,
    });

    setMessage("");
    setShowForm(true);
  };

  // ==========================================
  // CREATE / UPDATE
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage(
      editingId
        ? "Updating menu item..."
        : "Saving menu item..."
    );

    try {
      const menuData = {
        item_name: form.item_name,
        description: form.description,
        price: Number(form.price),
        status: form.status,
      };

      let response;

      // UPDATE
      if (editingId) {
        response = await api.put(
          `/menu/${editingId}`,
          menuData
        );
      }

      // CREATE
      else {
        response = await api.post(
          "/menu",
          menuData
        );
      }

      console.log("MENU RESPONSE:", response.data);

      setMessage(
        editingId
          ? "Menu item updated successfully!"
          : "Menu item added successfully!"
      );

      // Reset form
      setForm({
        item_name: "",
        description: "",
        price: "",
        status: "available",
      });

      setEditingId(null);
      setShowForm(false);

      // Reload data from Supabase
      await fetchMenuItems();

    } catch (error) {
      console.error("MENU ERROR:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to save menu item."
      );
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this menu item?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setMessage("Deleting menu item...");

      await api.delete(`/menu/${id}`);

      setMessage(
        "Menu item deleted successfully!"
      );

      await fetchMenuItems();

    } catch (error) {
      console.error("DELETE ERROR:", error);

      setMessage(
        error.response?.data?.message ||
          "Unable to delete menu item."
      );
    }
  };

  // ==========================================
  // CANCEL FORM
  // ==========================================

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);

    setForm({
      item_name: "",
      description: "",
      price: "",
      status: "available",
    });

    setMessage("");
  };

  // ==========================================
  // SEARCH
  // ==========================================

  const filteredItems = menuItems.filter((item) =>
    item.item_name
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

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
            onClick={() => navigate("/dashboard")}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Dashboard
          </button>

          {/* MENU */}

          <button
            onClick={() => navigate("/menu")}
            className="w-full text-left px-4 py-3 rounded-lg bg-pink-100 text-pink-600 font-semibold mb-1"
          >
            Menu Management
          </button>

          {/* INVENTORY */}

          <button
            onClick={() => navigate("/inventory")}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Inventory Management
          </button>

          {/* SALES */}

          <button
            onClick={() => navigate("/sales")}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Sales
          </button>

          {/* REPORTS */}

          <button
            onClick={() => navigate("/reports")}
            className="w-full text-left px-4 py-3 rounded-lg text-gray-600 hover:bg-pink-50 hover:text-pink-500 mb-1 transition"
          >
            Reports
          </button>

          {/* SETTINGS */}

          <button
            onClick={() => navigate("/settings")}
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

      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <main className="flex-1 p-8 overflow-auto">

        {/* HEADER */}

        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">

          <div>

            <h1 className="text-3xl font-bold text-gray-800">
              Menu Management
            </h1>

            <p className="text-gray-500 mt-1">
              Manage your café menu items, prices, and availability.
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

          <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6 text-gray-700">
            {message}
          </div>

        )}

        {/* ==========================================
            ADD / EDIT FORM
        ========================================== */}

        {showForm && (

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          >

            <div className="flex justify-between items-center mb-6">

              <h2 className="text-xl font-semibold text-gray-800">

                {editingId
                  ? "Edit Menu Item"
                  : "Add Menu Item"}

              </h2>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

              {/* ITEM NAME */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name
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

              {/* PRICE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
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

              {/* STATUS */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>

                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                >

                  <option value="available">
                    Available
                  </option>

                  <option value="unavailable">
                    Unavailable
                  </option>

                </select>

              </div>

            </div>

            {/* FORM BUTTONS */}

            <div className="flex justify-end gap-3 mt-6">

              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold"
              >

                {editingId
                  ? "Update Menu Item"
                  : "Save Menu Item"}

              </button>

            </div>

          </form>

        )}

        {/* ==========================================
            SEARCH
        ========================================== */}

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
            placeholder="Search menu items..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

        </div>

        {/* ==========================================
            MENU TABLE
        ========================================== */}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

          <div className="p-6 border-b">

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

          <div className="overflow-x-auto">

            <table className="w-full">

              <thead className="bg-gray-50">

                <tr>

                  <th className="text-left px-6 py-4 text-sm font-semibold text-gray-600">
                    Item Name
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
                      colSpan="5"
                      className="px-6 py-12 text-center text-gray-400"
                    >
                      No menu items found.
                    </td>

                  </tr>

                ) : (

                  filteredItems.map((item) => (

                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50"
                    >

                      <td className="px-6 py-4 font-medium text-gray-800">
                        {item.item_name}
                      </td>

                      <td className="px-6 py-4 text-gray-600">
                        {item.description || "-"}
                      </td>

                      <td className="px-6 py-4 text-gray-800">
                        ₱{Number(item.price).toFixed(2)}
                      </td>

                      <td className="px-6 py-4">

                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
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

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              handleEdit(item)
                            }
                            className="px-3 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg text-sm font-medium"
                          >
                            Edit
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(item.id)
                            }
                            className="px-3 py-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg text-sm font-medium"
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

    </div>
  );
}

export default MenuManagement;