import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function InventoryManagement() {
  // ==========================================
  // CURRENT USER
  // ==========================================

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [userBranchId, setUserBranchId] = useState(null);

  const isOwner =
    userRole === "owner" ||
    userRole === "admin";

  const isBranchStaff =
    !isOwner &&
    (
      userRole === "staff" ||
      userRole === "cashier" ||
      userRole === "manager"
    );

  // ==========================================
  // STATE
  // ==========================================

  const [inventory, setInventory] = useState([]);
  const [branches, setBranches] = useState([]);
  const [ingredients, setIngredients] = useState([]);

  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedBranch, setSelectedBranch] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================
  // ADD INVENTORY FORM
  // ==========================================

  const [form, setForm] = useState({
    branch_id: "",
    ingredient_id: "",
    quantity: "",
    low_stock_level: "",
  });

  // ==========================================
  // ADD INGREDIENT MODAL
  // ==========================================

  const [showIngredientModal, setShowIngredientModal] =
    useState(false);

  const [ingredientForm, setIngredientForm] = useState({
    ingredient_name: "",
    unit: "",
  });

  const [creatingIngredient, setCreatingIngredient] =
    useState(false);

  // ==========================================
  // EDIT MODAL
  // ==========================================

  const [editingItem, setEditingItem] = useState(null);

  const [editForm, setEditForm] = useState({
    branch_id: "",
    ingredient_id: "",
    quantity: "",
    low_stock_level: "",
  });

  // ==========================================
  // DELETE MODAL
  // ==========================================

  const [deletingItem, setDeletingItem] = useState(null);

  // ==========================================
  // LOAD CURRENT USER
  // ==========================================

  useEffect(() => {
    try {
      const storedUser =
        localStorage.getItem("user");

      const token =
        localStorage.getItem("token");

      console.log(
        "INVENTORY TOKEN EXISTS:",
        Boolean(token)
      );

      console.log(
        "STORED USER:",
        storedUser
      );

      if (!storedUser) {
        setError(
          "No logged-in user found. Please log in again."
        );
        return;
      }

      if (!token) {
        setError(
          "Access token is missing. Please log out and log in again."
        );
        return;
      }

      const parsedUser =
        JSON.parse(storedUser);

      console.log(
        "CURRENT LOGGED-IN USER:",
        parsedUser
      );

      const role = String(
        parsedUser.role || ""
      ).toLowerCase();

      const branchId =
        parsedUser.branch_id ??
        parsedUser.branchId ??
        null;

      setCurrentUser(parsedUser);
      setUserRole(role);

      setUserBranchId(
        branchId !== null
          ? Number(branchId)
          : null
      );

      // ==========================================
      // OWNER
      // ==========================================

      if (
        role === "owner" ||
        role === "admin"
      ) {
        setSelectedBranch("all");

        setForm((prev) => ({
          ...prev,
          branch_id: "",
        }));

        return;
      }

      // ==========================================
      // BRANCH STAFF
      // ==========================================

      if (
        role === "staff" ||
        role === "cashier" ||
        role === "manager"
      ) {
        if (!branchId) {
          setError(
            "Your account is not assigned to a branch. Please contact the owner."
          );
          return;
        }

        setSelectedBranch(
          String(branchId)
        );

        setForm((prev) => ({
          ...prev,
          branch_id: String(branchId),
        }));

        return;
      }

      setError(
        "Your account role is not recognized."
      );
    } catch (err) {
      console.error(
        "USER LOAD ERROR:",
        err
      );

      setError(
        "Unable to read your account information."
      );
    }
  }, []);

  // ==========================================
  // LOAD DATA
  // ==========================================

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    loadData();
  }, [currentUser]);

  // ==========================================
  // LOAD INVENTORY + BRANCHES + INGREDIENTS
  // ==========================================

  const loadData = async () => {
    setLoading(true);
    setError("");

    try {
      const [
        inventoryResponse,
        branchesResponse,
        ingredientsResponse,
      ] = await Promise.all([
        api.get("/inventory"),
        api.get("/inventory/branches/list"),
        api.get("/inventory/ingredients/list"),
      ]);

      const inventoryData =
        inventoryResponse.data;

      const branchesData =
        branchesResponse.data;

      const ingredientsData =
        ingredientsResponse.data;

      console.log(
        "INVENTORY RESPONSE:",
        inventoryData
      );

      console.log(
        "BRANCHES RESPONSE:",
        branchesData
      );

      console.log(
        "INGREDIENTS RESPONSE:",
        ingredientsData
      );

      if (
        !inventoryData.success
      ) {
        throw new Error(
          inventoryData.message ||
            "Failed to load inventory."
        );
      }

      if (
        !branchesData.success
      ) {
        throw new Error(
          branchesData.message ||
            "Failed to load branches."
        );
      }

      if (
        !ingredientsData.success
      ) {
        throw new Error(
          ingredientsData.message ||
            "Failed to load ingredients."
        );
      }

      setInventory(
        inventoryData.inventory || []
      );

      setBranches(
        branchesData.branches || []
      );

      setIngredients(
        ingredientsData.ingredients || []
      );
    } catch (err) {
      console.error(
        "Inventory loading error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load inventory data."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // FORM CHANGE
  // ==========================================

  const handleChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleEditChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    if (
      name === "branch_id" &&
      isBranchStaff
    ) {
      return;
    }

    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // INGREDIENT FORM CHANGE
  // ==========================================

  const handleIngredientChange = (e) => {
    const {
      name,
      value,
    } = e.target;

    setIngredientForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ==========================================
  // VALIDATE INVENTORY
  // ==========================================

  const validateForm = (
    currentForm
  ) => {
    if (!currentForm.branch_id) {
      return "Please select a branch.";
    }

    if (
      isBranchStaff &&
      Number(currentForm.branch_id) !==
        Number(userBranchId)
    ) {
      return "You can only manage inventory for your assigned branch.";
    }

    if (!currentForm.ingredient_id) {
      return "Please select an ingredient.";
    }

    if (
      currentForm.quantity === "" ||
      !Number.isFinite(
        Number(currentForm.quantity)
      ) ||
      Number(currentForm.quantity) < 0
    ) {
      return "Please enter a valid quantity.";
    }

    if (
      currentForm.low_stock_level === "" ||
      !Number.isFinite(
        Number(
          currentForm.low_stock_level
        )
      ) ||
      Number(
        currentForm.low_stock_level
      ) < 0
    ) {
      return "Please enter a valid low stock level.";
    }

    return null;
  };

  // ==========================================
  // ADD INVENTORY
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    const submitForm = {
      ...form,

      branch_id: isBranchStaff
        ? String(userBranchId)
        : form.branch_id,
    };

    const validationError =
      validateForm(submitForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      branch_id: Number(
        submitForm.branch_id
      ),

      ingredient_id: Number(
        submitForm.ingredient_id
      ),

      quantity: Number(
        submitForm.quantity
      ),

      low_stock_level: Number(
        submitForm.low_stock_level
      ),
    };

    try {
      const response =
        await api.post(
          "/inventory",
          payload
        );

      const data =
        response.data;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to add inventory."
        );
      }

      setMessage(
        "Inventory added successfully."
      );

      resetAddForm();

      await loadData();
    } catch (err) {
      console.error(
        "Add inventory error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to add inventory."
      );
    }
  };

  // ==========================================
  // CREATE NEW INGREDIENT
  // ==========================================

  const handleCreateIngredient =
    async (e) => {
      e.preventDefault();

      setMessage("");
      setError("");

      const ingredientName =
        ingredientForm.ingredient_name.trim();

      const unit =
        ingredientForm.unit.trim();

      if (!ingredientName) {
        setError(
          "Please enter an ingredient name."
        );
        return;
      }

      if (!unit) {
        setError(
          "Please enter the unit."
        );
        return;
      }

      try {
        setCreatingIngredient(true);

        console.log(
          "CREATING INGREDIENT:",
          {
            ingredient_name:
              ingredientName,
            unit,
          }
        );

        /*
         * This endpoint creates the ingredient
         * in the ingredients table.
         *
         * Expected:
         * POST /api/ingredients
         */

        const response =
          await api.post(
            "/ingredients",
            {
              ingredient_name:
                ingredientName,
              unit,
            }
          );

        const data =
          response.data;

        console.log(
          "CREATE INGREDIENT RESPONSE:",
          data
        );

        if (!data.success) {
          throw new Error(
            data.message ||
              "Failed to create ingredient."
          );
        }

        // ------------------------------------------
        // Find the newly-created ingredient
        // ------------------------------------------

        const newIngredient =
          data.ingredient;

        // ------------------------------------------
        // Reload ingredient list
        // ------------------------------------------

        const ingredientsResponse =
          await api.get(
            "/inventory/ingredients/list"
          );

        const ingredientsData =
          ingredientsResponse.data;

        const updatedIngredients =
          ingredientsData.ingredients || [];

        setIngredients(
          updatedIngredients
        );

        // ------------------------------------------
        // Automatically select the new ingredient
        // ------------------------------------------

        if (newIngredient?.id) {
          setForm((prev) => ({
            ...prev,
            ingredient_id:
              String(newIngredient.id),
          }));
        } else {
          const createdIngredient =
            updatedIngredients.find(
              (ingredient) =>
                String(
                  ingredient.ingredient_name ||
                    ingredient.name ||
                    ""
                ).toLowerCase() ===
                ingredientName.toLowerCase()
            );

          if (createdIngredient) {
            setForm((prev) => ({
              ...prev,
              ingredient_id:
                String(
                  createdIngredient.id
                ),
            }));
          }
        }

        setIngredientForm({
          ingredient_name: "",
          unit: "",
        });

        setShowIngredientModal(
          false
        );

        setMessage(
          `"${ingredientName}" was added successfully. You can now add its inventory stock.`
        );
      } catch (err) {
        console.error(
          "CREATE INGREDIENT ERROR:",
          err
        );

        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to create ingredient."
        );
      } finally {
        setCreatingIngredient(
          false
        );
      }
    };

  // ==========================================
  // EDIT
  // ==========================================

  const handleEdit = (item) => {
    setMessage("");
    setError("");

    if (
      isBranchStaff &&
      Number(item.branch_id) !==
        Number(userBranchId)
    ) {
      setError(
        "You can only edit inventory from your assigned branch."
      );
      return;
    }

    setEditingItem(item);

    setEditForm({
      branch_id:
        item.branch_id ?? "",

      ingredient_id:
        item.ingredient_id ?? "",

      quantity:
        item.quantity ?? "",

      low_stock_level:
        item.low_stock_level ?? "",
    });
  };

  // ==========================================
  // UPDATE
  // ==========================================

  const handleUpdate = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    if (!editingItem) {
      return;
    }

    const updateForm = {
      ...editForm,

      branch_id: isBranchStaff
        ? String(userBranchId)
        : editForm.branch_id,
    };

    const validationError =
      validateForm(updateForm);

    if (validationError) {
      setError(validationError);
      return;
    }

    const payload = {
      branch_id: Number(
        updateForm.branch_id
      ),

      ingredient_id: Number(
        updateForm.ingredient_id
      ),

      quantity: Number(
        updateForm.quantity
      ),

      low_stock_level: Number(
        updateForm.low_stock_level
      ),
    };

    try {
      const response =
        await api.put(
          `/inventory/${editingItem.id}`,
          payload
        );

      const data =
        response.data;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to update inventory."
        );
      }

      setMessage(
        "Inventory updated successfully."
      );

      closeEditModal();

      await loadData();
    } catch (err) {
      console.error(
        "Update inventory error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update inventory."
      );
    }
  };

  // ==========================================
  // DELETE
  // ==========================================

  const handleDeleteClick = (
    item
  ) => {
    setMessage("");
    setError("");

    if (
      isBranchStaff &&
      Number(item.branch_id) !==
        Number(userBranchId)
    ) {
      setError(
        "You can only delete inventory from your assigned branch."
      );
      return;
    }

    setDeletingItem(item);
  };

  const confirmDelete = async () => {
    if (!deletingItem) {
      return;
    }

    if (
      isBranchStaff &&
      Number(
        deletingItem.branch_id
      ) !== Number(userBranchId)
    ) {
      setError(
        "You can only delete inventory from your assigned branch."
      );

      setDeletingItem(null);

      return;
    }

    setMessage("");
    setError("");

    try {
      const response =
        await api.delete(
          `/inventory/${deletingItem.id}`
        );

      const data =
        response.data;

      if (!data.success) {
        throw new Error(
          data.message ||
            "Failed to delete inventory."
        );
      }

      setMessage(
        "Inventory deleted successfully."
      );

      setDeletingItem(null);

      await loadData();
    } catch (err) {
      console.error(
        "Delete inventory error:",
        err
      );

      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to delete inventory."
      );
    }
  };

  // ==========================================
  // RESET FORM
  // ==========================================

  const resetAddForm = () => {
    setForm({
      branch_id: isBranchStaff
        ? String(userBranchId)
        : "",

      ingredient_id: "",
      quantity: "",
      low_stock_level: "",
    });
  };

  const closeEditModal = () => {
    setEditingItem(null);

    setEditForm({
      branch_id: "",
      ingredient_id: "",
      quantity: "",
      low_stock_level: "",
    });
  };

  // ==========================================
  // CLOSE INGREDIENT MODAL
  // ==========================================

  const closeIngredientModal = () => {
    if (creatingIngredient) {
      return;
    }

    setShowIngredientModal(false);

    setIngredientForm({
      ingredient_name: "",
      unit: "",
    });
  };

  // ==========================================
  // DISPLAY NAMES
  // ==========================================

  const getBranchName = (
    branchId
  ) => {
    const branch =
      branches.find(
        (item) =>
          Number(item.id) ===
          Number(branchId)
      );

    return branch
      ? `${branch.branch_name} - ${branch.location}`
      : "Unknown Branch";
  };

  const getIngredientName = (
    ingredientId
  ) => {
    const ingredient =
      ingredients.find(
        (item) =>
          Number(item.id) ===
          Number(ingredientId)
      );

    if (!ingredient) {
      return "Unknown Ingredient";
    }

    return (
      ingredient.ingredient_name ||
      ingredient.name ||
      "Unknown Ingredient"
    );
  };

  const getIngredientUnit = (
    ingredientId
  ) => {
    const ingredient =
      ingredients.find(
        (item) =>
          Number(item.id) ===
          Number(ingredientId)
      );

    return ingredient?.unit || "";
  };

  // ==========================================
  // USER BRANCH NAME
  // ==========================================

  const getUserBranchName = () => {
    if (!userBranchId) {
      return "No Branch Assigned";
    }

    return getBranchName(
      userBranchId
    );
  };

  // ==========================================
  // STOCK STATUS
  // ==========================================

  const getStockStatus = (
    quantity,
    lowStockLevel
  ) => {
    const qty =
      Number(quantity);

    const low =
      Number(lowStockLevel);

    if (qty <= 0) {
      return {
        text: "OUT OF STOCK",
        className:
          "bg-red-100 text-red-700",
      };
    }

    if (qty <= low) {
      return {
        text: "LOW STOCK",
        className:
          "bg-yellow-100 text-yellow-700",
      };
    }

    return {
      text: "AVAILABLE",
      className:
        "bg-green-100 text-green-700",
    };
  };

  // ==========================================
  // BRANCH FILTER
  // ==========================================

  const branchFilteredInventory =
    isBranchStaff
      ? inventory.filter(
          (item) =>
            Number(item.branch_id) ===
            Number(userBranchId)
        )
      : selectedBranch === "all"
      ? inventory
      : inventory.filter(
          (item) =>
            Number(item.branch_id) ===
            Number(selectedBranch)
        );

  // ==========================================
  // SEARCH FILTER
  // ==========================================

  const normalizedQuery =
    searchQuery
      .trim()
      .toLowerCase();

  const filteredInventory =
    normalizedQuery
      ? branchFilteredInventory.filter(
          (item) => {
            const ingredientName =
              getIngredientName(
                item.ingredient_id
              ).toLowerCase();

            const branchName =
              getBranchName(
                item.branch_id
              ).toLowerCase();

            const idMatch =
              String(item.id).includes(
                normalizedQuery
              );

            return (
              ingredientName.includes(
                normalizedQuery
              ) ||
              branchName.includes(
                normalizedQuery
              ) ||
              idMatch
            );
          }
        )
      : branchFilteredInventory;

  // ==========================================
  // SUMMARY
  // ==========================================

  const totalRecords =
    filteredInventory.length;

  const availableCount =
    filteredInventory.filter(
      (item) =>
        Number(item.quantity) >
        Number(
          item.low_stock_level
        )
    ).length;

  const lowStockCount =
    filteredInventory.filter(
      (item) =>
        Number(item.quantity) > 0 &&
        Number(item.quantity) <=
          Number(
            item.low_stock_level
          )
    ).length;

  const outOfStockCount =
    filteredInventory.filter(
      (item) =>
        Number(item.quantity) <= 0
    ).length;

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="min-h-screen bg-[#faf7f8] flex">

      {/* ==========================================
          SIDEBAR
      ========================================== */}

      <div className="sticky top-0 h-screen self-start">
        <Sidebar />
      </div>

      {/* ==========================================
          MAIN
      ========================================== */}

      <main className="flex-1 p-8 overflow-x-hidden">

        {/* ==========================================
            HEADER
        ========================================== */}

        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>
            <h1 className="text-3xl font-bold text-[#26395d]">
              Inventory Management
            </h1>

            <p className="mt-1 text-gray-500">
              Manage ingredient stock for
              each Taste It Café branch.
            </p>
          </div>

          <div className="flex items-center gap-3">

            {isBranchStaff && (
              <div className="rounded-xl border border-[#b9dfe1] bg-[#eefafa] px-5 py-3">

                <p className="text-xs font-medium uppercase tracking-wide text-[#6b8589]">
                  Your Branch
                </p>

                <p className="mt-1 text-sm font-bold text-[#26395d]">
                  📍 {getUserBranchName()}
                </p>

              </div>
            )}

          

            <button
              type="button"
              onClick={loadData}
              className="rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              ↻ Refresh
            </button>

          </div>

        </div>

        {/* ==========================================
            ACCESS INFORMATION
        ========================================== */}

        {isBranchStaff && (
          <div className="mb-6 rounded-2xl border border-[#b9dfe1] bg-[#eefafa] px-5 py-4">

            <div className="flex items-start gap-3">

              <div className="text-xl">
                🏪
              </div>

              <div>

                <p className="font-semibold text-[#26395d]">
                  Branch Inventory
                </p>

                <p className="mt-1 text-sm text-[#61777c]">
                  You are viewing inventory
                  for your assigned branch
                  only. You cannot manage
                  inventory from other branches.
                </p>

              </div>

            </div>

          </div>
        )}

       

        {/* ==========================================
            MESSAGES
        ========================================== */}

        {message && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">
            ✓ {message}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
            ⚠ {error}
          </div>
        )}

        {/* ==========================================
            SUMMARY CARDS
        ========================================== */}

        <div className="mb-6 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Total Records
            </p>

            <h2 className="mt-2 text-3xl font-bold text-[#26395d]">
              {totalRecords}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              {isBranchStaff
                ? "Your branch inventory"
                : "Across selected branch(es)"}
            </p>

          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Available
            </p>

            <h2 className="mt-2 text-3xl font-bold text-green-600">
              {availableCount}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Above low stock level
            </p>

          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Low Stock
            </p>

            <h2 className="mt-2 text-3xl font-bold text-yellow-600">
              {lowStockCount}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Needs restocking soon
            </p>

          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

            <p className="text-sm font-medium text-gray-500">
              Out of Stock
            </p>

            <h2 className="mt-2 text-3xl font-bold text-red-600">
              {outOfStockCount}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Needs immediate attention
            </p>

          </div>

        </div>

        {/* ==========================================
            ADD INVENTORY
        ========================================== */}

        <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

            <div>

              <h2 className="text-lg font-bold text-[#26395d]">
                Add Inventory
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {isBranchStaff
                  ? "Add ingredient stock for your assigned branch."
                  : "Add ingredient stock for a specific branch."}
              </p>

            </div>

            {isOwner && (
              <button
                type="button"
                onClick={() =>
                  setShowIngredientModal(true)
                }
                className="rounded-xl border border-[#e7a6ce] bg-pink-50 px-4 py-2.5 text-sm font-semibold text-[#a34c7d] transition hover:bg-pink-100"
              >
                + Create New Ingredient
              </button>
            )}

          </div>

          <form onSubmit={handleSubmit}>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

              {/* BRANCH */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Branch
                </label>

                {isBranchStaff ? (

                  <div className="flex min-h-[48px] items-center rounded-xl border border-[#b9dfe1] bg-[#f3fbfb] px-4 text-sm font-semibold text-[#26395d]">
                    📍 {getUserBranchName()}
                  </div>

                ) : (

                  <select
                    name="branch_id"
                    value={form.branch_id}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  >

                    <option value="">
                      Select Branch
                    </option>

                    {branches.map(
                      (branch) => (
                        <option
                          key={branch.id}
                          value={branch.id}
                        >
                          {branch.branch_name}
                          {" - "}
                          {branch.location}
                        </option>
                      )
                    )}

                  </select>

                )}

              </div>

              {/* INGREDIENT */}

              <div>

                <div className="mb-2 flex items-center justify-between">

                  <label className="block text-sm font-semibold text-gray-700">
                    Ingredient
                  </label>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() =>
                        setShowIngredientModal(true)
                      }
                      className="text-xs font-semibold text-pink-500 hover:text-pink-600"
                    >
                      
                    </button>
                  )}

                </div>

                <select
                  name="ingredient_id"
                  value={form.ingredient_id}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                >

                  <option value="">
                    Select Ingredient
                  </option>

                  {ingredients.map(
                    (ingredient) => (
                      <option
                        key={ingredient.id}
                        value={ingredient.id}
                      >
                        {
                          ingredient.ingredient_name ||
                          ingredient.name
                        }

                        {ingredient.unit
                          ? ` (${ingredient.unit})`
                          : ""}
                      </option>
                    )
                  )}

                </select>

                {form.ingredient_id && (
                  <p className="mt-2 text-xs text-gray-400">
                    Unit:{" "}
                    {getIngredientUnit(
                      form.ingredient_id
                    ) || "-"}
                  </p>
                )}

              </div>

              {/* QUANTITY */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Quantity
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="quantity"
                  value={form.quantity}
                  onChange={handleChange}
                  placeholder="Enter quantity"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

              </div>

              {/* LOW STOCK */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-gray-700">
                  Low Stock Level
                </label>

                <input
                  type="number"
                  step="0.01"
                  min="0"
                  name="low_stock_level"
                  value={
                    form.low_stock_level
                  }
                  onChange={handleChange}
                  placeholder="Enter minimum stock"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                />

              </div>

            </div>

            {/* BUTTONS */}

            <div className="mt-6 flex gap-3">

              <button
                type="submit"
                className="rounded-xl bg-[#ed72bd] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#df5eac]"
              >
                + Add Inventory
              </button>

              <button
                type="button"
                onClick={resetAddForm}
                className="rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Clear
              </button>

            </div>

          </form>

        </div>

        {/* ==========================================
            INVENTORY RECORDS
        ========================================== */}

        <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">

          <div className="border-b border-gray-100 p-6">

            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">

              <div>

                <h2 className="text-lg font-bold text-[#26395d]">
                  Inventory Records
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  {isBranchStaff
                    ? "Inventory records for your assigned branch."
                    : "View and manage ingredient inventory by branch."}
                </p>

              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">

                {/* SEARCH */}

                <div className="relative">

                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    🔍
                  </span>

                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(
                        e.target.value
                      )
                    }
                    placeholder={
                      isBranchStaff
                        ? "Search ingredient or ID..."
                        : "Search ingredient, branch, or ID..."
                    }
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100 sm:w-64"
                  />

                </div>

                {/* OWNER BRANCH FILTER */}

                {isOwner ? (

                  <select
                    value={selectedBranch}
                    onChange={(e) =>
                      setSelectedBranch(
                        e.target.value
                      )
                    }
                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  >

                    <option value="all">
                      All Branches
                    </option>

                    {branches.map(
                      (branch) => (
                        <option
                          key={branch.id}
                          value={branch.id}
                        >
                          {branch.branch_name}
                        </option>
                      )
                    )}

                  </select>

                ) : (

                  <div className="rounded-xl border border-[#b9dfe1] bg-[#eefafa] px-4 py-2.5 text-sm font-semibold text-[#26395d]">
                    📍 {getUserBranchName()}
                  </div>

                )}

                <span className="whitespace-nowrap text-sm text-gray-500">
                  {filteredInventory.length}{" "}
                  {filteredInventory.length ===
                  1
                    ? "record"
                    : "records"}
                </span>

              </div>

            </div>

          </div>

          {/* LOADING */}

          {loading ? (

            <div className="py-16 text-center">

              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-pink-100 border-t-[#ed72bd]"></div>

              <p className="mt-4 text-sm text-gray-500">
                Loading inventory...
              </p>

            </div>

          ) : filteredInventory.length ===
            0 ? (

            <div className="py-16 text-center">

              <div className="mb-3 text-4xl">
                📦
              </div>

              <h3 className="text-base font-semibold text-gray-700">
                {normalizedQuery
                  ? "No matching records found"
                  : "No inventory records yet"}
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                {normalizedQuery
                  ? "Try a different search term or clear the filter."
                  : isBranchStaff
                  ? "Your assigned branch does not have inventory records yet."
                  : "Add your first ingredient inventory above."}
              </p>

            </div>

          ) : (

            /* ==========================================
               TABLE WRAPPER
               table-fixed + colgroup below lock every
               column to the same width for every branch,
               so switching branches (e.g. Marigondon vs
               Babag) never changes the table's shape —
               only the row data changes.
            ========================================== */

            <div className="mx-6 mb-6 max-h-[520px] overflow-y-auto overflow-x-auto rounded-xl border border-gray-200">

              <table className="w-full min-w-[1100px] table-fixed border-collapse">

                <colgroup>
                  <col className="w-[70px]" />
                  <col className="w-[220px]" />
                  <col className="w-[220px]" />
                  <col className="w-[130px]" />
                  <col className="w-[120px]" />
                  <col className="w-[130px]" />
                  <col className="w-[150px]" />
                  <col className="w-[150px]" />
                </colgroup>

                <thead className="sticky top-0 z-10 bg-gray-50">

                  <tr className="border-b border-gray-200">

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      ID
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Branch
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Ingredient
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Quantity
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Low Stock
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Updated
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                      Actions
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {filteredInventory.map(
                    (item) => {

                      const stockStatus =
                        getStockStatus(
                          item.quantity,
                          item.low_stock_level
                        );

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-gray-100 bg-white transition hover:bg-gray-50"
                        >

                          <td className="truncate px-4 py-4 text-sm text-gray-500">
                            #{item.id}
                          </td>

                          <td className="truncate px-4 py-4 text-sm text-gray-700">

                            <span
                              className="block truncate font-medium text-[#26395d]"
                              title={getBranchName(
                                item.branch_id
                              )}
                            >
                              📍{" "}
                              {getBranchName(
                                item.branch_id
                              )}
                            </span>

                          </td>

                          <td className="truncate px-4 py-4 text-sm font-semibold text-gray-800">

                            <div
                              className="truncate"
                              title={getIngredientName(
                                item.ingredient_id
                              )}
                            >
                              {getIngredientName(
                                item.ingredient_id
                              )}
                            </div>

                            <div className="mt-1 truncate text-xs font-normal text-gray-400">
                              {getIngredientUnit(
                                item.ingredient_id
                              )}
                            </div>

                          </td>

                          <td className="truncate px-4 py-4 text-sm font-medium text-gray-700">

                            {Number(
                              item.quantity
                            ).toFixed(2)}

                            {" "}

                            <span className="text-xs text-gray-400">
                              {getIngredientUnit(
                                item.ingredient_id
                              )}
                            </span>

                          </td>

                          <td className="truncate px-4 py-4 text-sm text-gray-600">

                            {Number(
                              item.low_stock_level
                            ).toFixed(2)}

                          </td>

                          <td className="px-4 py-4">

                            <span
                              className={`inline-flex w-[102px] justify-center rounded-full px-2.5 py-1 text-[10px] font-bold ${stockStatus.className}`}
                            >
                              {stockStatus.text}
                            </span>

                          </td>

                          <td className="truncate px-4 py-4 text-xs text-gray-500">

                            {item.updated_at
                              ? new Date(
                                  item.updated_at
                                ).toLocaleString()
                              : "-"}

                          </td>

                          <td className="px-4 py-4">

                            <div className="flex gap-2">

                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    item
                                  )
                                }
                                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition hover:bg-gray-100"
                              >
                                Edit
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteClick(
                                    item
                                  )
                                }
                                className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-100"
                              >
                                Delete
                              </button>

                            </div>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>

      </main>

      {/* ==========================================
          ADD INGREDIENT MODAL
      ========================================== */}

      {showIngredientModal && (

        <div
          className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/55 p-5"
          onClick={closeIngredientModal}
        >

          <div
            className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            {/* HEADER */}

            <div className="border-b border-gray-100 px-6 py-5">

              <div className="flex items-start justify-between">

                <div>

                  <h2 className="text-xl font-bold text-[#26395d]">
                    Add New Ingredient
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Create an ingredient that
                    can be used in inventory
                    and menu recipes.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={
                    closeIngredientModal
                  }
                  disabled={
                    creatingIngredient
                  }
                  className="text-2xl leading-none text-gray-400 transition hover:text-gray-800"
                >
                  ×
                </button>

              </div>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleCreateIngredient
              }
            >

              <div className="space-y-5 p-6">

                {/* EXAMPLE INFO */}

                <div className="rounded-xl border border-[#b9dfe1] bg-[#eefafa] px-4 py-3">

                  <p className="text-sm font-semibold text-[#26395d]">
                    Example
                  </p>

                  <p className="mt-1 text-xs text-[#61777c]">
                    Ingredient: Burger Patty
                    {" • "}
                    Unit: kg
                  </p>

                </div>

                {/* INGREDIENT NAME */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Ingredient Name
                  </label>

                  <input
                    type="text"
                    name="ingredient_name"
                    value={
                      ingredientForm.ingredient_name
                    }
                    onChange={
                      handleIngredientChange
                    }
                    placeholder="Example: Burger Patty"
                    required
                    autoFocus
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  />

                </div>

                {/* UNIT */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Unit
                  </label>

                  <select
                    name="unit"
                    value={
                      ingredientForm.unit
                    }
                    onChange={
                      handleIngredientChange
                    }
                    required
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  >

                    <option value="">
                      Select Unit
                    </option>

                    <option value="kg">
                      kg
                    </option>

                    <option value="g">
                      g
                    </option>

                    <option value="L">
                      L
                    </option>

                    <option value="ml">
                      ml
                    </option>

                    <option value="pcs">
                      pcs
                    </option>

                    <option value="pack">
                      pack
                    </option>

                    <option value="bottle">
                      bottle
                    </option>

                    <option value="box">
                      box
                    </option>

                    <option value="sachet">
                      sachet
                    </option>

                  </select>

                </div>

                {/* EXPLANATION */}

                <div className="rounded-xl bg-gray-50 p-4">

                  <p className="text-xs leading-5 text-gray-500">

                    After creating the ingredient,
                    it will automatically appear
                    in the <strong>Ingredient</strong>
                    dropdown above. You can then
                    enter its quantity and low-stock
                    level.

                  </p>

                </div>

              </div>

              {/* FOOTER */}

              <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">

                <button
                  type="button"
                  onClick={
                    closeIngredientModal
                  }
                  disabled={
                    creatingIngredient
                  }
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    creatingIngredient
                  }
                  className="rounded-xl bg-[#ed72bd] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#df5eac] disabled:opacity-50"
                >
                  {creatingIngredient
                    ? "Creating..."
                    : "Create Ingredient"}
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ==========================================
          EDIT MODAL
      ========================================== */}

      {editingItem && (

        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-5"
          onClick={closeEditModal}
        >

          <div
            className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="flex items-start justify-between border-b border-gray-200 px-6 py-5">

              <div>

                <h2 className="text-xl font-bold text-[#26395d]">
                  Edit Inventory
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Update the inventory
                  information.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeEditModal
                }
                className="text-2xl leading-none text-gray-400 transition hover:text-gray-800"
              >
                ×
              </button>

            </div>

            <form
              onSubmit={handleUpdate}
            >

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                {/* BRANCH */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Branch
                  </label>

                  {isBranchStaff ? (

                    <div className="flex min-h-[48px] items-center rounded-xl border border-[#b9dfe1] bg-[#f3fbfb] px-4 text-sm font-semibold text-[#26395d]">
                      📍{" "}
                      {getUserBranchName()}
                    </div>

                  ) : (

                    <select
                      name="branch_id"
                      value={
                        editForm.branch_id
                      }
                      onChange={
                        handleEditChange
                      }
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                    >

                      <option value="">
                        Select Branch
                      </option>

                      {branches.map(
                        (branch) => (
                          <option
                            key={branch.id}
                            value={branch.id}
                          >
                            {
                              branch.branch_name
                            }
                            {" - "}
                            {
                              branch.location
                            }
                          </option>
                        )
                      )}

                    </select>

                  )}

                </div>

                {/* INGREDIENT */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Ingredient
                  </label>

                  <select
                    name="ingredient_id"
                    value={
                      editForm.ingredient_id
                    }
                    onChange={
                      handleEditChange
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  >

                    <option value="">
                      Select Ingredient
                    </option>

                    {ingredients.map(
                      (ingredient) => (
                        <option
                          key={ingredient.id}
                          value={
                            ingredient.id
                          }
                        >
                          {
                            ingredient.ingredient_name ||
                            ingredient.name
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

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Quantity
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="quantity"
                    value={
                      editForm.quantity
                    }
                    onChange={
                      handleEditChange
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  />

                </div>

                {/* LOW STOCK */}

                <div>

                  <label className="mb-2 block text-sm font-semibold text-gray-700">
                    Low Stock Level
                  </label>

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="low_stock_level"
                    value={
                      editForm.low_stock_level
                    }
                    onChange={
                      handleEditChange
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-pink-400 focus:ring-2 focus:ring-pink-100"
                  />

                </div>

              </div>

              {isBranchStaff && (
                <div className="mx-6 mb-2 rounded-xl border border-[#b9dfe1] bg-[#eefafa] px-4 py-3 text-sm text-[#526d72]">
                  🔒 This inventory record
                  belongs to your assigned
                  branch. The branch cannot
                  be changed.
                </div>
              )}

              <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">

                <button
                  type="button"
                  onClick={
                    closeEditModal
                  }
                  className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="rounded-xl bg-[#ed72bd] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#df5eac]"
                >
                  Save Changes
                </button>

              </div>

            </form>

          </div>

        </div>

      )}

      {/* ==========================================
          DELETE MODAL
      ========================================== */}

      {deletingItem && (

        <div
          className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/55 p-5"
          onClick={() =>
            setDeletingItem(null)
          }
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl font-bold text-red-600">
              !
            </div>

            <h2 className="text-xl font-bold text-[#26395d]">
              Delete Inventory?
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Are you sure you want to
              delete this inventory
              record?
            </p>

            <div className="my-5 flex flex-col gap-1 rounded-xl bg-gray-50 p-4">

              <strong className="text-sm text-gray-800">
                {getIngredientName(
                  deletingItem.ingredient_id
                )}
              </strong>

              <span className="text-xs text-gray-500">
                {getBranchName(
                  deletingItem.branch_id
                )}
              </span>

              <span className="text-xs text-gray-500">
                Quantity:{" "}
                {Number(
                  deletingItem.quantity
                ).toFixed(2)}
              </span>

            </div>

            <p className="text-xs font-medium text-red-600">
              This action cannot be undone.
            </p>

            <div className="mt-6 flex justify-end gap-3">

              <button
                type="button"
                onClick={() =>
                  setDeletingItem(null)
                }
                className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                Yes, Delete
              </button>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}

export default InventoryManagement;