import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

function Report() {
  // ======================================================
  // STATE
  // ======================================================

  const [sales, setSales] = useState([]);
  const [branches, setBranches] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState("all");

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [totalSales, setTotalSales] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ======================================================
  // LOAD BRANCHES
  // ======================================================

  const loadBranches = async () => {
    try {
      const response = await api.get("/inventory/branches");

      const branchData =
        response.data.branches ||
        response.data.data ||
        response.data ||
        [];

      setBranches(
        Array.isArray(branchData) ? branchData : []
      );
    } catch (error) {
      console.error("Error loading branches:", error);

      setBranches([]);
    }
  };

  // ======================================================
  // LOAD SALES
  //
  // Matches:
  // GET /api/sales
  //
  // Optional:
  // branch_id
  // start_date
  // end_date
  // ======================================================

  const loadSales = async () => {
    try {
      setLoading(true);
      setError("");

      // --------------------------------------------------
      // BUILD QUERY PARAMETERS
      // --------------------------------------------------

      const params = {};

      if (selectedBranch !== "all") {
        params.branch_id = selectedBranch;
      }

      if (startDate) {
        params.start_date = startDate;
      }

      if (endDate) {
        params.end_date = endDate;
      }

      // --------------------------------------------------
      // GET SALES
      // --------------------------------------------------

      const response = await api.get("/sales", {
        params,
      });

      const data = response.data;

      // --------------------------------------------------
      // SET SALES
      // --------------------------------------------------

      const salesData = data.sales || [];

      setSales(
        Array.isArray(salesData)
          ? salesData
          : []
      );

      // --------------------------------------------------
      // USE TOTAL FROM BACKEND
      // --------------------------------------------------

      setTotalSales(
        Number(data.total_sales || 0)
      );

      setTotalTransactions(
        Number(data.count || salesData.length || 0)
      );
    } catch (error) {
      console.error(
        "Error loading sales:",
        error
      );

      setError(
        error.response?.data?.message ||
          "Failed to load sales report."
      );

      setSales([]);
      setTotalSales(0);
      setTotalTransactions(0);
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // INITIAL LOAD
  // ======================================================

  useEffect(() => {
    loadBranches();
  }, []);

  // ======================================================
  // LOAD SALES WHEN FILTER CHANGES
  // ======================================================

  useEffect(() => {
    loadSales();
  }, [
    selectedBranch,
    startDate,
    endDate,
  ]);

  // ======================================================
  // FORMAT CURRENCY
  // ======================================================

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(amount || 0));
  };

  // ======================================================
  // FORMAT DATE
  //
  // Uses sale_date from Supabase
  // ======================================================

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    return new Date(dateValue).toLocaleDateString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // ======================================================
  // FORMAT DATE + TIME
  // ======================================================

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "N/A";
    }

    return new Date(dateValue).toLocaleString(
      "en-PH",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      }
    );
  };

  // ======================================================
  // AVERAGE SALE
  // ======================================================

  const averageSale =
    totalTransactions > 0
      ? totalSales / totalTransactions
      : 0;

  // ======================================================
  // RESET FILTERS
  // ======================================================

  const resetFilters = () => {
    setSelectedBranch("all");
    setStartDate("");
    setEndDate("");
  };

  // ======================================================
  // GET SELECTED BRANCH NAME
  // ======================================================

  const getSelectedBranchName = () => {
    if (selectedBranch === "all") {
      return "All Branches";
    }

    const branch = branches.find(
      (item) =>
        String(item.id) ===
        String(selectedBranch)
    );

    return (
      branch?.branch_name ||
      "Selected Branch"
    );
  };

  // ======================================================
  // UI
  // ======================================================

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* ==================================================
          SIDEBAR
      ================================================== */}
<div className="sticky top-0 h-screen self-start">
      <Sidebar />
</div>
      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <main className="flex-1 p-6 md:p-8">

        {/* ==================================================
            HEADER
        ================================================== */}

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">
            Sales Reports
          </h1>

          <p className="mt-1 text-gray-500">
            View sales performance by branch and date.
          </p>
        </div>

        {/* ==================================================
            FILTERS
        ================================================== */}

        <div className="mb-6 rounded-xl bg-white p-5 shadow-sm">

          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Report Filters
            </h2>

            <p className="text-sm text-gray-500">
              Currently viewing:{" "}
              <span className="font-medium text-gray-700">
                {getSelectedBranchName()}
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">

            {/* ==================================================
                BRANCH DROPDOWN
            ================================================== */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Branch
              </label>

              <select
                value={selectedBranch}
                onChange={(e) =>
                  setSelectedBranch(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">
                  All Branches
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>

            {/* ==================================================
                START DATE
            ================================================== */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                value={startDate}
                onChange={(e) =>
                  setStartDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* ==================================================
                END DATE
            ================================================== */}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </label>

              <input
                type="date"
                value={endDate}
                onChange={(e) =>
                  setEndDate(
                    e.target.value
                  )
                }
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 outline-none transition focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* ==================================================
                RESET
            ================================================== */}

            <div className="flex items-end">
              <button
                onClick={resetFilters}
                className="w-full rounded-lg bg-gray-200 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-300"
              >
                Reset Filters
              </button>
            </div>

          </div>
        </div>

        {/* ==================================================
            ERROR MESSAGE
        ================================================== */}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
            <p className="font-medium">
              Error
            </p>

            <p className="text-sm">
              {error}
            </p>
          </div>
        )}

        {/* ==================================================
            SUMMARY CARDS
        ================================================== */}

        <div className="mb-6 grid grid-cols-1 gap-5 md:grid-cols-3">

          {/* ==================================================
              TOTAL SALES
          ================================================== */}

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Sales
                </p>

                <h2 className="mt-2 text-3xl font-bold text-green-600">
                  {formatCurrency(
                    totalSales
                  )}
                </h2>
              </div>

              <div className="rounded-full bg-green-100 p-3">
                <span className="text-xl">
                  ₱
                </span>
              </div>

            </div>
          </div>

          {/* ==================================================
              TRANSACTIONS
          ================================================== */}

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Total Transactions
                </p>

                <h2 className="mt-2 text-3xl font-bold text-blue-600">
                  {totalTransactions}
                </h2>
              </div>

              <div className="rounded-full bg-blue-100 p-3">
                <span className="text-xl">
                  #
                </span>
              </div>

            </div>
          </div>

          {/* ==================================================
              AVERAGE SALE
          ================================================== */}

          <div className="rounded-xl bg-white p-5 shadow-sm">

            <div className="flex items-center justify-between">

              <div>
                <p className="text-sm font-medium text-gray-500">
                  Average Sale
                </p>

                <h2 className="mt-2 text-3xl font-bold text-purple-600">
                  {formatCurrency(
                    averageSale
                  )}
                </h2>
              </div>

              <div className="rounded-full bg-purple-100 p-3">
                <span className="text-xl">
                  ₱
                </span>
              </div>

            </div>
          </div>

        </div>

        {/* ==================================================
            SALES TABLE
        ================================================== */}

        <div className="overflow-hidden rounded-xl bg-white shadow-sm">

          {/* ==================================================
              TABLE HEADER
          ================================================== */}
               
          <div className="flex flex-col gap-3 border-b p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-semibold text-gray-800">
                Sales Report
              </h2>

              <p className="text-sm text-gray-500">
                {getSelectedBranchName()}
              </p>
            </div>
                    
            <button
              onClick={loadSales}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? "Loading..."
                : "Refresh"}
            </button>

          </div>

          {/* ==================================================
              LOADING
          ================================================== */}

          {loading ? (
            <div className="p-10 text-center">

              <div className="mb-3 text-gray-500">
                Loading sales report...
              </div>

            </div>
          ) : sales.length === 0 ? (

            /* ==================================================
                NO SALES
            ================================================== */

            <div className="p-10 text-center">

              <p className="font-medium text-gray-600">
                No sales records found.
              </p>

              <p className="mt-1 text-sm text-gray-400">
                Try changing the branch or date filters.
              </p>

            </div>
          ) : (

            /* ==================================================
                TABLE
            ================================================== */

            <div className="overflow-x-auto">

              <table className="w-full">

                {/* ==================================================
                    TABLE HEAD
                ================================================== */}
                
                <thead className="bg-gray-50">

                  <tr>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-sm font-semibold text-gray-600">
                      #
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-sm font-semibold text-gray-600">
                      Transaction Number
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-sm font-semibold text-gray-600">
                      Branch
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-sm font-semibold text-gray-600">
                      Cashier
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-left text-sm font-semibold text-gray-600">
                      Sale Date
                    </th>

                    <th className="whitespace-nowrap px-5 py-3 text-right text-sm font-semibold text-gray-600">
                      Total
                    </th>

                  </tr>

                </thead>
                        
                {/* ==================================================
                    TABLE BODY
                ================================================== */}
            
                <tbody className="divide-y divide-gray-200">

                  {sales.map((sale, index) => (

                    <tr
                      key={sale.id}
                      className="transition hover:bg-gray-50"
                    >

                      {/* ROW NUMBER */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-500">
                        {index + 1}
                      </td>

                      {/* TRANSACTION NUMBER */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-blue-600">
                        {sale.transaction_number ||
                          "N/A"}
                      </td>

                      {/* BRANCH */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {sale.branch_name ||
                          "Unknown Branch"}
                      </td>

                      {/* CASHIER */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-700">
                        {sale.cashier_name ||
                          "Unknown Cashier"}
                      </td>

                      {/* SALE DATE */}

                      <td className="whitespace-nowrap px-5 py-4 text-sm text-gray-600">
                        <div>
                          {formatDate(
                            sale.sale_date
                          )}
                        </div>

                        <div className="text-xs text-gray-400">
                          {formatDateTime(
                            sale.sale_date
                          )}
                        </div>
                      </td>

                      {/* TOTAL */}

                      <td className="whitespace-nowrap px-5 py-4 text-right text-sm font-bold text-gray-800">
                        {formatCurrency(
                          sale.total_amount
                        )}
                      </td>

                    </tr>
                        
                  ))}

                </tbody>

                {/* ==================================================
                    TABLE FOOTER
                ================================================== */}

                <tfoot className="bg-gray-50">

                  <tr>

                    <td
                      colSpan="5"
                      className="px-5 py-4 text-right font-bold text-gray-700"
                    >
                      Total Sales:
                    </td>

                    <td className="px-5 py-4 text-right font-bold text-green-600">
                      {formatCurrency(
                        totalSales
                      )}
                    </td>

                  </tr>

                </tfoot>

              </table>

            </div>

          )}

        </div>

      </main>
    </div>
  );
}

export default Report;