import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";

const API_URL = "http://localhost:5000/api";

function Sales() {
  const navigate = useNavigate();

  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingSale, setProcessingSale] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // ======================================================
  // GET MENU ITEMS
  // ======================================================

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/");
        return;
      }

      const response = await axios.get(`${API_URL}/menu`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setMenuItems(response.data.menuItems || []);
      } else {
        setError("Failed to load menu items.");
      }
    } catch (err) {
      console.error("Error loading menu:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to load menu items."
      );
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // ADD ITEM TO CART
  // ======================================================

  const addToCart = (menuItem) => {
    setMessage("");
    setError("");

    if (menuItem.status !== "available") {
      setError(
        `${menuItem.item_name} is currently unavailable.`
      );
      return;
    }

    setCart((currentCart) => {
      const existingItem = currentCart.find(
        (item) => item.menu_item_id === menuItem.id
      );

      if (existingItem) {
        const newQuantity = existingItem.quantity + 1;

        return currentCart.map((item) =>
          item.menu_item_id === menuItem.id
            ? {
                ...item,
                quantity: newQuantity,
                subtotal:
                  newQuantity * Number(item.unit_price),
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          menu_item_id: menuItem.id,
          item_name: menuItem.item_name,
          quantity: 1,
          unit_price: Number(menuItem.price),
          subtotal: Number(menuItem.price),
        },
      ];
    });
  };

  // ======================================================
  // INCREASE QUANTITY
  // ======================================================

  const increaseQuantity = (menuItemId) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.menu_item_id === menuItemId
          ? {
              ...item,
              quantity: item.quantity + 1,
              subtotal:
                (item.quantity + 1) *
                Number(item.unit_price),
            }
          : item
      )
    );
  };

  // ======================================================
  // DECREASE QUANTITY
  // ======================================================

  const decreaseQuantity = (menuItemId) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.menu_item_id === menuItemId
            ? {
                ...item,
                quantity: item.quantity - 1,
                subtotal:
                  (item.quantity - 1) *
                  Number(item.unit_price),
              }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  // ======================================================
  // REMOVE ITEM
  // ======================================================

  const removeFromCart = (menuItemId) => {
    setCart((currentCart) =>
      currentCart.filter(
        (item) => item.menu_item_id !== menuItemId
      )
    );
  };

  // ======================================================
  // CALCULATE TOTAL
  // ======================================================

  const totalAmount = cart.reduce(
    (total, item) => total + Number(item.subtotal),
    0
  );

  // ======================================================
  // COMPLETE SALE
  // ======================================================

  const completeSale = async () => {
    if (cart.length === 0) {
      setError(
        "Please add at least one item to the order."
      );
      return;
    }

    if (processingSale) {
      return;
    }

    try {
      setProcessingSale(true);
      setMessage("");
      setError("");

      const token = localStorage.getItem("token");

      if (!token) {
        setError(
          "Your session has expired. Please log in again."
        );
        navigate("/");
        return;
      }

      const saleItems = cart.map((item) => ({
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
      }));

      const response = await axios.post(
        `${API_URL}/sales`,
        {
          items: saleItems,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const transactionNumber =
          response.data.sale?.transaction_number;

        setMessage(
          transactionNumber
            ? `Sale completed successfully! Transaction: ${transactionNumber}`
            : "Sale completed successfully!"
        );

        setCart([]);

        // Refresh menu after successful sale
        await fetchMenuItems();
      } else {
        setError(
          response.data.message ||
            "Failed to complete sale."
        );
      }
    } catch (err) {
      console.error("Complete sale error:", err);

      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Failed to complete sale."
      );
    } finally {
      setProcessingSale(false);
    }
  };

  // ======================================================
  // LOADING
  // ======================================================

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <div className="sticky top-0 h-screen self-start">
          <Sidebar />
        </div>

        <main className="flex-1 p-8 overflow-x-hidden">
          <div className="flex items-center justify-center min-h-[70vh]">
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto"></div>

              <p className="text-gray-500 mt-4">
                Loading menu...
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ======================================================
  // FRONTEND
  // ======================================================

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR */}

      <div className="sticky top-0 h-screen self-start">
        <Sidebar />
      </div>

      {/* MAIN CONTENT */}

      <main className="flex-1 p-8 overflow-x-hidden">
        {/* HEADER */}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Sales
          </h1>

          <p className="text-gray-500 mt-1">
            Create a new customer order
          </p>
        </div>

        {/* SUCCESS MESSAGE */}

        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3.5 text-green-700">
            {message}
          </div>
        )}

        {/* ERROR MESSAGE */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 text-red-700">
            {error}
          </div>
        )}

        {/* ==================================================
            SALES CONTENT
        ================================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-6 items-start">
          {/* ==================================================
              MENU
          ================================================== */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Menu Items
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  Select an item to add it to the order
                </p>
              </div>

              <span className="text-sm text-gray-500">
                {menuItems.length} items
              </span>
            </div>

            {menuItems.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">☕</div>

                <p className="font-medium text-gray-700">
                  No menu items available.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {menuItems.map((item) => {
                  const available =
                    item.status === "available";

                  return (
                    <button
                      key={item.id}
                      onClick={() => addToCart(item)}
                      disabled={!available}
                      className={`
                        group
                        text-left
                        rounded-xl
                        border
                        p-5
                        transition
                        duration-200
                        ${
                          available
                            ? "border-gray-200 bg-white hover:border-pink-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                            : "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="text-base font-semibold text-gray-800 group-hover:text-gray-900">
                            {item.item_name}
                          </h3>

                          <p className="mt-2 text-lg font-bold text-gray-800">
                            ₱
                            {Number(item.price).toFixed(2)}
                          </p>
                        </div>

                        <span
                          className={`
                            px-2.5 py-1 rounded-full text-xs font-semibold
                            ${
                              available
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-200 text-gray-600"
                            }
                          `}
                        >
                          {item.status}
                        </span>
                      </div>

                      {available && (
                        <div className="mt-4 text-xs font-semibold text-gray-400 group-hover:text-pink-500">
                          Click to add +
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ==================================================
              CURRENT ORDER
          ================================================== */}

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 xl:sticky xl:top-5">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  Current Order
                </h2>

                <p className="text-sm text-gray-500 mt-1">
                  {cart.length === 0
                    ? "No items selected"
                    : `${cart.length} item${
                        cart.length > 1 ? "s" : ""
                      }`}
                </p>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  disabled={processingSale}
                  className="text-sm font-semibold text-pink-500 hover:text-pink-600 disabled:opacity-50"
                >
                  Clear
                </button>
              )}
            </div>

            {cart.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🛒</div>

                <p className="font-medium text-gray-700">
                  No items in the order.
                </p>

                <p className="text-sm text-gray-500 mt-1">
                  Click a menu item to add it.
                </p>
              </div>
            ) : (
              <div>
                {/* CART ITEMS */}

                <div className="max-h-[430px] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div
                      key={item.menu_item_id}
                      className="border-b border-gray-100 py-4 last:border-b-0"
                    >
                      {/* ITEM INFO */}

                      <div className="flex justify-between gap-3 mb-3">
                        <div className="min-w-0">
                          <h3 className="font-semibold text-gray-800 truncate">
                            {item.item_name}
                          </h3>

                          <p className="text-sm text-gray-500 mt-1">
                            ₱
                            {Number(item.unit_price).toFixed(2)}{" "}
                            each
                          </p>
                        </div>

                        <strong className="text-gray-800 whitespace-nowrap">
                          ₱{Number(item.subtotal).toFixed(2)}
                        </strong>
                      </div>

                      {/* QUANTITY */}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() =>
                              decreaseQuantity(item.menu_item_id)
                            }
                            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 text-gray-700 text-lg font-medium transition"
                          >
                            −
                          </button>

                          <span className="w-10 text-center text-sm font-semibold text-gray-800">
                            {item.quantity}
                          </span>

                          <button
                            onClick={() =>
                              increaseQuantity(item.menu_item_id)
                            }
                            className="w-9 h-9 bg-gray-50 hover:bg-gray-100 text-gray-700 text-lg font-medium transition"
                          >
                            +
                          </button>
                        </div>

                        <button
                          onClick={() =>
                            removeFromCart(item.menu_item_id)
                          }
                          className="text-xs font-medium text-red-500 hover:text-red-700 transition"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* TOTAL */}

                <div className="flex items-center justify-between border-t-2 border-gray-200 mt-4 pt-5">
                  <span className="text-base font-medium text-gray-500">
                    Total
                  </span>

                  <strong className="text-2xl font-bold text-gray-800">
                    ₱{totalAmount.toFixed(2)}
                  </strong>
                </div>

                {/* COMPLETE SALE */}

                <button
                  onClick={completeSale}
                  disabled={processingSale}
                  className="w-full mt-5 rounded-lg bg-green-600 px-4 py-3.5 text-white font-semibold text-base hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {processingSale
                    ? "Processing..."
                    : "Complete Sale"}
                </button>

                {/* CLEAR ORDER */}

                <button
                  onClick={() => setCart([])}
                  disabled={processingSale}
                  className="w-full mt-2.5 rounded-lg border border-gray-200 bg-white px-4 py-3 text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Clear Order
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Sales;