function OwnerDashboard() {
  return (
    <div className="min-h-screen bg-gray-100">

      <header className="bg-white border-b px-8 py-5">
        <h1 className="text-2xl font-bold text-gray-800">
          Taste It Café
        </h1>

        <p className="text-gray-500">
          Owner Dashboard
        </p>
      </header>

      <main className="p-8">

        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          Welcome, Owner!
        </h2>

        <p className="text-gray-600">
          You are successfully logged in.
        </p>

      </main>

    </div>
  );
}

export default OwnerDashboard;