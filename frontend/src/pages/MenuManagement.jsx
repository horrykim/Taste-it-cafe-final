import { useState } from "react";
import Sidebar from "../components/Sidebar";

function MenuManagement() {

  // ==========================================
  // STATE
  // ==========================================

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);

  const [menuItems, setMenuItems] = useState([]);

  const [form, setForm] = useState({
    item_name: "",
    description: "",
    price: "",
    status: "available",
  });

  const [editingId, setEditingId] = useState(null);


  // ==========================================
  // HANDLE INPUT
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };


  // ==========================================
  // RESET FORM
  // ==========================================

  const resetForm = () => {

    setForm({
      item_name: "",
      description: "",
      price: "",
      status: "available",
    });

    setEditingId(null);
    setShowForm(false);
  };


  // ==========================================
  // ADD / UPDATE MENU ITEM
  // ==========================================

  const handleSubmit = (e) => {

    e.preventDefault();

    if (!form.item_name.trim()) {
      alert("Please enter a menu item name.");
      return;
    }

    if (!form.price || Number(form.price) < 0) {
      alert("Please enter a valid price.");
      return;
    }


    // UPDATE

    if (editingId !== null) {

      setMenuItems((prev) =>
        prev.map((item) =>
          item.id === editingId
            ? {
                ...item,
                item_name: form.item_name,
                description: form.description,
                price: Number(form.price),
                status: form.status,
              }
            : item
        )
      );

      resetForm();
      return;
    }


    // ADD

    const newItem = {
      id: Date.now(),
      item_name: form.item_name,
      description: form.description,
      price: Number(form.price),
      status: form.status,
    };

    setMenuItems((prev) => [
      ...prev,
      newItem,
    ]);

    resetForm();
  };


  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (item) => {

    setForm({
      item_name: item.item_name,
      description: item.description,
      price: item.price,
      status: item.status,
    });

    setEditingId(item.id);
    setShowForm(true);
  };


  // ==========================================
  // DELETE
  // ==========================================

  const handleDelete = (id) => {

    const confirmDelete = window.confirm(
      "Are you sure you want to delete this menu item?"
    );

    if (!confirmDelete) {
      return;
    }

    setMenuItems((prev) =>
      prev.filter((item) => item.id !== id)
    );
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
  // UI
  // ==========================================

  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* ==========================================
          SHARED SIDEBAR
      ========================================== */}

      <Sidebar />


      {/* ==========================================
          MAIN CONTENT
      ========================================== */}

      <main className="flex-1 p-8 overflow-auto">


        {/* ==========================================
            HEADER
        ========================================== */}

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
            onClick={() => {

              if (showForm) {
                resetForm();
              } else {
                setShowForm(true);
              }

            }}
            className="bg-pink-500 hover:bg-pink-600 text-white px-5 py-3 rounded-lg font-semibold transition"
          >
            {showForm
              ? "Cancel"
              : "+ Add Menu Item"}
          </button>

        </div>


        {/* ==========================================
            ADD / EDIT FORM
        ========================================== */}

        {showForm && (

          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-xl shadow-sm border p-6 mb-6"
          >

            <h2 className="text-xl font-semibold text-gray-800 mb-6">

              {editingId !== null
                ? "Edit Menu Item"
                : "Add Menu Item"}

            </h2>


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
                />

              </div>


              {/* PRICE */}

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price
                </label>

                <div className="relative">

                  <span className="absolute left-4 top-3 text-gray-500">
                    ₱
                  </span>

                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg pl-9 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
                  />

                </div>

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
                onClick={resetForm}
                className="px-5 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition"
              >
                Cancel
              </button>


              <button
                type="submit"
                className="px-5 py-3 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-semibold transition"
              >

                {editingId !== null
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
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-pink-400"
          />

        </div>


        {/* ==========================================
            MENU TABLE
        ========================================== */}

        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">


          {/* TABLE HEADER */}

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


          {/* TABLE */}

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
                      className="px-6 py-16 text-center"
                    >

                      <p className="text-lg font-medium text-gray-400">
                        No menu items found
                      </p>

                      <p className="text-sm text-gray-400 mt-1">
                        Click "Add Menu Item" to create your first item.
                      </p>

                    </td>

                  </tr>

                ) : (

                  filteredItems.map((item) => (

                    <tr
                      key={item.id}
                      className="border-t hover:bg-gray-50"
                    >

                      {/* NAME */}

                      <td className="px-6 py-4">

                        <p className="font-semibold text-gray-800">
                          {item.item_name}
                        </p>

                      </td>


                      {/* DESCRIPTION */}

                      <td className="px-6 py-4 text-gray-600">
                        {item.description || "—"}
                      </td>


                      {/* PRICE */}

                      <td className="px-6 py-4 font-semibold text-gray-800">
                        ₱{Number(item.price).toFixed(2)}
                      </td>


                      {/* STATUS */}

                      <td className="px-6 py-4">

                        {item.status === "available" ? (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Available
                          </span>

                        ) : (

                          <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                            Unavailable
                          </span>

                        )}

                      </td>


                      {/* ACTIONS */}

                      <td className="px-6 py-4">

                        <div className="flex gap-2">

                          <button
                            onClick={() => handleEdit(item)}
                            className="px-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            Edit
                          </button>


                          <button
                            onClick={() => handleDelete(item.id)}
                            className="px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg"
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