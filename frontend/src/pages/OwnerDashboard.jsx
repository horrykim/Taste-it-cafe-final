import Sidebar from "../components/Sidebar";

function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 flex">

      {/* SIDEBAR */}
      <Sidebar />

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-auto">

        {/* HEADER */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800">
            Dashboard
          </h2>

          <p className="text-gray-500 mt-1">
            Welcome back! Here's what's happening at Taste It Café.
          </p>
        </div>


        {/* ==========================================
            STAT CARDS
        ========================================== */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">

          {/* TOTAL SALES */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500">
              Total Sales Today
            </p>

            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              ₱0.00
            </h3>

            <p className="text-sm text-green-500 mt-2">
              Today's sales
            </p>
          </div>


          {/* TOTAL ITEMS SOLD */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500">
              Total Items Sold
            </p>

            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              0
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Items sold today
            </p>
          </div>


          {/* INVENTORY ITEMS */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500">
              Inventory Items
            </p>

            <h3 className="text-3xl font-bold text-gray-800 mt-2">
              0
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Items in inventory
            </p>
          </div>


          {/* LOW STOCK */}
          <div className="bg-white rounded-xl shadow-sm border p-6">
            <p className="text-sm text-gray-500">
              Low Stock Items
            </p>

            <h3 className="text-3xl font-bold text-red-500 mt-2">
              0
            </h3>

            <p className="text-sm text-gray-500 mt-2">
              Need attention
            </p>
          </div>

        </div>


        {/* ==========================================
            SALES OVERVIEW + ALERTS
        ========================================== */}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* SALES OVERVIEW */}
          <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border p-6">

            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">

              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  Sales Overview
                </h3>

                <p className="text-sm text-gray-500">
                  Sales performance
                </p>
              </div>

              <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
                <option>This Year</option>
              </select>

            </div>


            {/* CHART PLACEHOLDER */}
            <div className="h-72 bg-gray-50 rounded-lg flex items-center justify-center">

              <p className="text-gray-400">
                Sales analytics chart will appear here
              </p>

            </div>

          </div>


          {/* RECENT ALERTS */}
          <div className="bg-white rounded-xl shadow-sm border p-6">

            <h3 className="text-lg font-semibold text-gray-800">
              Recent Alerts
            </h3>

            <p className="text-sm text-gray-500 mb-6">
              Important system notifications
            </p>


            <div className="space-y-4">

              {/* LOW STOCK */}
              <div className="p-4 rounded-lg bg-red-50">

                <p className="font-semibold text-red-600">
                  Low Stock
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  No low stock alerts yet.
                </p>

              </div>


              {/* INVENTORY */}
              <div className="p-4 rounded-lg bg-yellow-50">

                <p className="font-semibold text-yellow-600">
                  Inventory
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  No inventory adjustments yet.
                </p>

              </div>


              {/* SALES */}
              <div className="p-4 rounded-lg bg-blue-50">

                <p className="font-semibold text-blue-600">
                  Sales
                </p>

                <p className="text-sm text-gray-600 mt-1">
                  No recent sales yet.
                </p>

              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}

export default OwnerDashboard;