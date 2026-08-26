import { useEffect, useState, useMemo } from "react";
import Sidebar from "../components/Sidebar";
import api from "../services/api";

const REASONS = ["Physical Count", "Waste / Spoilage", "Delivery Variance", "Sales Correction", "Theft / Loss", "Found Stock", "Other"];

function Reconciliation() {
  // ==========================================
  // AUTH / BRANCH
  // ==========================================
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [userBranchId, setUserBranchId] = useState(null);
  const isOwner = userRole === "owner" || userRole === "admin";
  const isBranchStaff = !isOwner && ["staff", "cashier", "manager"].includes(userRole);

  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("all");

  // ==========================================
  // DATA
  // ==========================================
  const [sheet, setSheet] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [counts, setCounts] = useState({}); // key `${branch_id}-${ingredient_id}` -> { physical, reason }
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("count");
  const [filter, setFilter] = useState("all");
  const [defaultReason, setDefaultReason] = useState("Physical Count");
  const [historySearch, setHistorySearch] = useState("");

  // ==========================================
  // LOAD USER
  // ==========================================
  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      if (!raw || !token) { setError("No logged-in user found. Please log in again."); return; }
      const u = JSON.parse(raw);
      const role = String(u.role || "").toLowerCase();
      const bid = u.branch_id ?? u.branchId ?? null;
      setCurrentUser(u);
      setUserRole(role);
      setUserBranchId(bid !== null ? Number(bid) : null);
      if (role === "owner" || role === "admin") setSelectedBranch("all");
      else if (["staff", "cashier", "manager"].includes(role)) {
        if (!bid) setError("Your account is not assigned to a branch. Contact owner.");
        else setSelectedBranch(String(bid));
      } else setError("Your account role is not recognized.");
    } catch (e) { console.error(e); setError("Unable to read your account information."); }
  }, []);

  // ==========================================
  // LOAD BRANCHES
  // ==========================================
  const loadBranches = async () => {
    try {
      const res = await api.get("/inventory/branches/list");
      setBranches(res.data.branches || []);
    } catch (e) { console.error("branches error", e); }
  };

  // ==========================================
  // LOAD SHEET + HISTORY + STATS
  // ==========================================
  const loadSheet = async () => {
    if (!currentUser) return;
    setLoading(true); setError(""); setMessage("");
    try {
      const branchParam = selectedBranch === "all" && isOwner ? "all" : selectedBranch;
      // try new sheet endpoint, fallback to legacy GET /reconciliation
      let sheetData = [];
      try {
        const r = await api.get("/reconciliation/sheet", { params: { branch_id: branchParam } });
        sheetData = r.data.sheet || r.data.reconciliation || [];
      } catch (_) {
        const r = await api.get("/reconciliation", { params: { branch_id: branchParam } });
        sheetData = r.data.sheet || r.data.reconciliation || r.data.data || [];
      }
      // try stats, ignore failure
      try {
        const s = await api.get("/reconciliation/stats", { params: { branch_id: branchParam } });
        setStats(s.data.stats || null);
      } catch { setStats(null); }

      // normalize: ensure fields expectedQuantity/system_quantity compatibility
      const normalized = sheetData.map((row) => ({
        ...row,
        system_quantity: row.system_quantity ?? row.expected_quantity ?? row.quantity ?? 0,
        ingredient_name: row.ingredient_name || row.name || "Unknown Ingredient",
        branch_name: row.branch_name || `Branch ${row.branch_id}`,
      }));
      setSheet(normalized);
      const next = {};
      normalized.forEach((row) => {
        const key = `${row.branch_id}-${row.ingredient_id}`;
        next[key] = {
          physical: String(row.system_quantity ?? 0),
          reason: defaultReason,
          branch_id: row.branch_id,
          ingredient_id: row.ingredient_id,
        };
      });
      setCounts(next);
    } catch (e) {
      console.error("sheet load", e);
      setError(e.response?.data?.message || "Failed to load reconciliation sheet.");
      setSheet([]);
    } finally { setLoading(false); }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const branchParam = selectedBranch === "all" && isOwner ? "all" : selectedBranch;
      const res = await api.get("/reconciliation/history", { params: { branch_id: branchParam, limit: 100, search: historySearch || undefined } });
      setHistory(res.data.history || []);
    } catch (e) { console.error("history load", e); }
    finally { setHistoryLoading(false); }
  };

  useEffect(() => { if (!currentUser) return; loadBranches(); }, [currentUser]);
  useEffect(() => { if (!currentUser) return; loadSheet(); loadHistory(); }, [currentUser, selectedBranch]); // eslint-disable-line
  useEffect(() => {
    const t = setTimeout(() => { if (activeTab === "history") loadHistory(); }, 350);
    return () => clearTimeout(t);
  }, [historySearch]); // eslint-disable-line
  useEffect(() => { if (activeTab === "history" && currentUser) loadHistory(); }, [activeTab]); // eslint-disable-line

  // ==========================================
  // HELPERS
  // ==========================================
  const shortBranchName = (id) => {
    const b = branches.find((x) => Number(x.id) === Number(id));
    return b ? b.branch_name : `Branch ${id}`;
  };

  const updateCount = (key, field, value) => setCounts((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));

  const getDiff = (row) => {
    const key = `${row.branch_id}-${row.ingredient_id}`;
    const entry = counts[key];
    if (!entry) return 0;
    const phys = Number(entry.physical);
    if (!Number.isFinite(phys)) return 0;
    return phys - Number(row.system_quantity);
  };

  const getVarianceStatus = (diff) => {
    if (diff === 0) return { label: "Matched", cls: "bg-green-100 text-green-700 border-green-200" };
    if (diff < 0) return { label: "Shortage", cls: "bg-red-100 text-red-700 border-red-200" };
    return { label: "Overage", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  };

  // ==========================================
  // FILTERING
  // ==========================================
  const filteredSheet = useMemo(() => {
    let out = sheet;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((r) => String(r.ingredient_name).toLowerCase().includes(q) || String(r.unit).toLowerCase().includes(q) || String(r.branch_name).toLowerCase().includes(q));
    }
    if (filter !== "all") {
      out = out.filter((r) => {
        const diff = getDiff(r);
        if (filter === "shortage") return diff < 0;
        if (filter === "overage") return diff > 0;
        if (filter === "matched") return diff === 0;
        if (filter === "lowstock") return Number(r.system_quantity) <= Number(r.low_stock_level);
        return true;
      });
    }
    return out;
  }, [sheet, search, filter, counts]);

  const pendingStats = useMemo(() => {
    let matched = 0, shortage = 0, overage = 0, changed = 0;
    sheet.forEach((r) => {
      const d = getDiff(r);
      if (d === 0) matched++; else if (d < 0) shortage++; else overage++;
      if (String(counts[`${r.branch_id}-${r.ingredient_id}`]?.physical) !== String(r.system_quantity)) changed++;
    });
    return { matched, shortage, overage, changed, total: sheet.length };
  }, [sheet, counts]);

  const filteredHistory = useMemo(() => {
    if (!historySearch.trim()) return history;
    const q = historySearch.trim().toLowerCase();
    return history.filter((h) => String(h.ingredient_name).toLowerCase().includes(q) || String(h.reason || "").toLowerCase().includes(q) || String(h.branch_name).toLowerCase().includes(q));
  }, [history, historySearch]);

  // totals for read-only summary (matches old expected/actual)
  const totalExpected = useMemo(() => sheet.reduce((s, r) => s + Number(r.system_quantity || 0), 0), [sheet]);
  const totalActual = useMemo(() => {
    return sheet.reduce((s, r) => {
      const key = `${r.branch_id}-${r.ingredient_id}`;
      const phys = Number(counts[key]?.physical);
      return s + (Number.isFinite(phys) ? phys : Number(r.system_quantity || 0));
    }, 0);
  }, [sheet, counts]);
  const totalDifference = totalActual - totalExpected;

  // ==========================================
  // ACTIONS
  // ==========================================
  const markAllMatched = () => {
    const next = { ...counts };
    sheet.forEach((r) => {
      const key = `${r.branch_id}-${r.ingredient_id}`;
      next[key] = { ...next[key], physical: String(r.system_quantity), reason: defaultReason };
    });
    setCounts(next);
    setMessage("All physical counts reset to system quantity (matched).");
    setTimeout(() => setMessage(""), 2500);
  };

  const clearCounts = () => {
    const next = {};
    sheet.forEach((r) => {
      const key = `${r.branch_id}-${r.ingredient_id}`;
      next[key] = { ...next[key], physical: "", reason: defaultReason };
    });
    setCounts(next);
  };

  const reconcileSingle = async (row) => {
    const key = `${row.branch_id}-${row.ingredient_id}`;
    const entry = counts[key];
    if (!entry) return;
    if (entry.physical === "" || !Number.isFinite(Number(entry.physical)) || Number(entry.physical) < 0) { setError(`Enter a valid physical quantity for ${row.ingredient_name}.`); return; }
    if (isBranchStaff && Number(row.branch_id) !== Number(userBranchId)) { setError("You can only reconcile your assigned branch."); return; }
    setSaving(true); setError(""); setMessage("");
    try {
      const res = await api.post("/reconciliation", { branch_id: row.branch_id, ingredient_id: row.ingredient_id, physical_quantity: Number(entry.physical), reason: entry.reason || defaultReason });
      setMessage(res.data.message || `Reconciled ${row.ingredient_name}: ${res.data.difference > 0 ? "+" : ""}${res.data.difference} ${row.unit}`);
      await loadSheet(); await loadHistory();
    } catch (e) { console.error(e); setError(e.response?.data?.message || `Failed to reconcile ${row.ingredient_name}.`); }
    finally { setSaving(false); }
  };

  const reconcileBulk = async () => {
    const toSubmit = filteredSheet
      .map((r) => ({ row: r, entry: counts[`${r.branch_id}-${r.ingredient_id}`] }))
      .filter(({ entry, row }) => entry && entry.physical !== "" && Number.isFinite(Number(entry.physical)) && Number(entry.physical) >= 0)
      .filter(({ entry, row }) => String(entry.physical) !== String(row.system_quantity));
    if (toSubmit.length === 0) { setError("No changes detected. Modify at least one physical count that differs from system quantity."); return; }
    if (isBranchStaff) {
      const foreign = toSubmit.find(({ row }) => Number(row.branch_id) !== Number(userBranchId));
      if (foreign) { setError("You can only reconcile your assigned branch."); return; }
    }
    const byBranch = {};
    toSubmit.forEach(({ row, entry }) => {
      const bid = row.branch_id;
      if (!byBranch[bid]) byBranch[bid] = [];
      byBranch[bid].push({ ingredient_id: row.ingredient_id, physical_quantity: Number(entry.physical), reason: entry.reason || defaultReason });
    });
    const branchIds = Object.keys(byBranch);
    if (branchIds.length > 1) {
      const ok = window.confirm(`You are about to reconcile ${toSubmit.length} items across ${branchIds.length} branches. Continue?`);
      if (!ok) return;
    }
    setSaving(true); setError(""); setMessage("");
    let totalOk = 0, totalErr = 0, lastMsg = "";
    try {
      for (const bid of branchIds) {
        try {
          const res = await api.post("/reconciliation/bulk", { branch_id: Number(bid), items: byBranch[bid], default_reason: defaultReason });
          totalOk += res.data.count || byBranch[bid].length;
          if (res.data.errors?.length) totalErr += res.data.errors.length;
          lastMsg = res.data.message;
        } catch (bulkErr) {
          // fallback single posts per item if bulk endpoint missing
          if (bulkErr.response?.status === 404) {
            for (const it of byBranch[bid]) {
              try {
                await api.post("/reconciliation", { branch_id: Number(bid), ingredient_id: it.ingredient_id, physical_quantity: it.physical_quantity, reason: it.reason });
                totalOk++;
              } catch { totalErr++; }
            }
          } else throw bulkErr;
        }
      }
      setMessage(`Bulk reconciliation complete: ${totalOk} item(s) updated${totalErr ? `, ${totalErr} failed` : ""}. ${lastMsg}`);
      await loadSheet(); await loadHistory();
    } catch (e) { console.error(e); setError(e.response?.data?.message || "Bulk reconciliation failed. Try single reconcile."); }
    finally { setSaving(false); }
  };

  const reconcileAllFilteredMatched = async () => {
    const valid = filteredSheet.map((r) => ({ r, entry: counts[`${r.branch_id}-${r.ingredient_id}`] })).filter(({ entry }) => entry && entry.physical !== "" && Number.isFinite(Number(entry.physical)) && Number(entry.physical) >= 0);
    if (valid.length === 0) { setError("Enter physical quantities first."); return; }
    const ok = window.confirm(`Confirm reconciliation for ${valid.length} item(s)? This will update inventory to physical counts.`);
    if (!ok) return;
    setSaving(true); setError("");
    try {
      const byBranch = {};
      valid.forEach(({ r, entry }) => {
        if (!byBranch[r.branch_id]) byBranch[r.branch_id] = [];
        byBranch[r.branch_id].push({ ingredient_id: r.ingredient_id, physical_quantity: Number(entry.physical), reason: entry.reason || defaultReason });
      });
      for (const bid of Object.keys(byBranch)) {
        try {
          await api.post("/reconciliation/bulk", { branch_id: Number(bid), items: byBranch[bid] });
        } catch {
          for (const it of byBranch[bid]) await api.post("/reconciliation", { branch_id: Number(bid), ingredient_id: it.ingredient_id, physical_quantity: it.physical_quantity, reason: it.reason });
        }
      }
      setMessage(`Confirmed ${valid.length} item(s). Inventory updated to physical counts.`);
      await loadSheet(); await loadHistory();
    } catch (e) { setError(e.response?.data?.message || "Failed to confirm counts."); }
    finally { setSaving(false); }
  };

  const exportCSV = () => {
    const headers = ["Branch", "Ingredient", "Unit", "System Qty", "Physical Qty", "Difference", "Reason", "Status"];
    const rows = filteredSheet.map((r) => {
      const key = `${r.branch_id}-${r.ingredient_id}`;
      const entry = counts[key] || {};
      const diff = getDiff(r);
      const { label } = getVarianceStatus(diff);
      return [`"${r.branch_name}"`, `"${r.ingredient_name}"`, r.unit, r.system_quantity, entry.physical ?? "", diff, `"${String(entry.reason || "").replace(/"/g, '""')}"`, label].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `reconciliation-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  };

  // ==========================================
  // RENDER
  // ==========================================
  if (!currentUser && !error) {
    return (
      <div className="min-h-screen bg-gray-100 flex">
        <div className="sticky top-0 h-screen self-start"><Sidebar /></div>
        <main className="flex-1 p-8 flex items-center justify-center"><p className="text-gray-500">Loading...</p></main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf7f8] flex">
      <div className="sticky top-0 h-screen self-start"><Sidebar /></div>
      <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
        {/* HEADER */}
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[#26395d]">Inventory Reconciliation</h1>
            <p className="mt-1 text-gray-500">Compare expected inventory with actual inventory and identify discrepancies.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isBranchStaff ? (
              <div className="rounded-xl border border-[#b9dfe1] bg-[#eefafa] px-4 py-2.5 text-sm font-semibold text-[#26395d]">📍 {shortBranchName(userBranchId)}</div>
            ) : (
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
                <option value="all">All Branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.branch_name} - {b.location}</option>)}
              </select>
            )}
            <button onClick={() => { loadSheet(); loadHistory(); }} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">↻ Refresh</button>
          </div>
        </div>

        {isBranchStaff && <div className="mb-6 rounded-2xl border border-[#b9dfe1] bg-[#eefafa] px-5 py-4 flex gap-3"><span className="text-xl">🏪</span><div><p className="font-semibold text-[#26395d]">Branch Locked</p><p className="text-sm text-[#61777c]">You can only reconcile your assigned branch.</p></div></div>}
        {message && <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-700">✓ {message}</div>}
        {error && <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">⚠ {error}</div>}

        {/* SUMMARY CARDS - expected/actual/difference (legacy) + variance */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 mb-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Expected Quantity</p>
            <h2 className="mt-2 text-3xl font-bold text-[#26395d]">{totalExpected.toFixed(2)}</h2>
            <p className="text-xs text-gray-400 mt-1">{pendingStats.total} items • system total</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Actual Quantity</p>
            <h2 className="mt-2 text-3xl font-bold text-[#26395d]">{totalActual.toFixed(2)}</h2>
            <p className="text-xs text-gray-400 mt-1">physical total (editable)</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Total Difference</p>
            <h2 className={`mt-2 text-3xl font-bold ${totalDifference === 0 ? "text-green-600" : totalDifference < 0 ? "text-red-600" : "text-orange-500"}`}>{totalDifference > 0 ? "+" : ""}{totalDifference.toFixed(2)}</h2>
            <p className="text-xs text-gray-400 mt-1">{pendingStats.shortage} shortage • {pendingStats.overage} overage • {pendingStats.matched} matched</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-gray-500">Pending Changes</p>
            <h2 className="mt-2 text-3xl font-bold text-amber-600">{pendingStats.changed}</h2>
            <p className="text-xs text-gray-400 mt-1">{stats?.last_reconciliation ? `Last: ${new Date(stats.last_reconciliation).toLocaleString()}` : "No history yet"}{stats?.adjustments ? ` • ${stats.adjustments.total_adjustments} in 30d` : ""}</p>
          </div>
        </div>

        {/* TABS */}
        <div className="mb-6 flex gap-2 bg-white rounded-xl p-1.5 border border-gray-200 w-fit">
          <button onClick={() => setActiveTab("count")} className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "count" ? "bg-[#26395d] text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}>Count Sheet {pendingStats.changed ? `• ${pendingStats.changed} pending` : ""}</button>
          <button onClick={() => setActiveTab("history")} className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === "history" ? "bg-[#26395d] text-white shadow" : "text-gray-600 hover:bg-gray-100"}`}>History ({history.length})</button>
        </div>

        {activeTab === "count" ? (
          <>
            {/* CONTROLS */}
            <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1">
                  <div className="relative flex-1 max-w-sm">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
                    <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search ingredient, branch, unit..." className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" />
                  </div>
                  <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100">
                    <option value="all">All variances</option>
                    <option value="shortage">Shortages only</option>
                    <option value="overage">Overages only</option>
                    <option value="matched">Matched only</option>
                    <option value="lowstock">Low stock items</option>
                  </select>
                  <select value={defaultReason} onChange={(e) => setDefaultReason(e.target.value)} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none">
                    {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={markAllMatched} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">✓ Mark all matched</button>
                  <button onClick={clearCounts} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">Clear</button>
                  <button onClick={exportCSV} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50">⬇ Export CSV</button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button onClick={reconcileBulk} disabled={saving || pendingStats.changed === 0} className="rounded-xl bg-[#ed72bd] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#df5eac] disabled:opacity-50 disabled:cursor-not-allowed">Reconcile Changed ({pendingStats.changed})</button>
                <button onClick={reconcileAllFilteredMatched} disabled={saving || filteredSheet.length === 0} className="rounded-xl border border-[#26395d] bg-white px-6 py-2.5 text-sm font-semibold text-[#26395d] hover:bg-gray-50 disabled:opacity-50">Confirm All Filtered ({filteredSheet.length})</button>
                <span className="text-xs text-gray-400 self-center ml-2">Default reason: {defaultReason} • Click row “Save” to reconcile individually</span>
              </div>
            </div>

            {/* SHEET TABLE - combines expected/actual/difference legacy columns with editable physical */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="border-b border-gray-100 p-5 flex justify-between items-center">
                <div><h2 className="text-lg font-bold text-[#26395d]">Reconciliation Details</h2><p className="text-sm text-gray-500">Compare inventory quantities and identify differences.</p></div>
                <span className="text-sm text-gray-500">{filteredSheet.length} / {sheet.length} shown</span>
              </div>

              {loading ? (
                <div className="py-16 text-center"><div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-pink-100 border-t-[#ed72bd]"></div><p className="mt-4 text-sm text-gray-500">Loading reconciliation...</p></div>
              ) : filteredSheet.length === 0 ? (
                <div className="py-16 text-center"><div className="text-4xl mb-3">📊</div><h3 className="font-semibold text-gray-700">{sheet.length === 0 ? "No reconciliation records found." : "No matching items"}</h3><p className="text-sm text-gray-500 mt-1">{sheet.length === 0 ? "Add inventory first or select a branch with stock." : "Try a different search or filter."}</p></div>
              ) : (
                <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                  <table className="w-full min-w-[1080px] table-fixed border-collapse">
                    <colgroup><col className="w-[180px]" /><col className="w-[120px]" /><col className="w-[70px]" /><col className="w-[100px]" /><col className="w-[130px]" /><col className="w-[110px]" /><col className="w-[110px]" /><col className="w-[140px]" /></colgroup>
                    <thead className="sticky top-0 z-10 bg-gray-50">
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Ingredient</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Branch</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Unit</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Expected</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Actual (Physical)</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Difference</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Status</th>
                        <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredSheet.map((row) => {
                        const key = `${row.branch_id}-${row.ingredient_id}`;
                        const entry = counts[key] || { physical: "", reason: defaultReason };
                        const diff = getDiff(row);
                        const v = getVarianceStatus(diff);
                        const isChanged = String(entry.physical) !== String(row.system_quantity) && entry.physical !== "";
                        return (
                          <tr key={key} className={`border-b border-gray-100 transition ${isChanged ? "bg-amber-50/50" : "bg-white"} hover:bg-gray-50`}>
                            <td className="px-4 py-3"><div className="font-semibold text-gray-800 truncate" title={row.ingredient_name}>{row.ingredient_name}</div><select value={entry.reason || defaultReason} onChange={(e) => updateCount(key, "reason", e.target.value)} className="mt-1 w-full rounded border border-gray-200 bg-white px-1 py-1 text-[10px] outline-none"><option value="" disabled>Reason</option>{REASONS.map((r) => <option key={r} value={r}>{r}</option>)}</select></td>
                            <td className="px-3 py-3 text-sm text-gray-600 truncate" title={row.branch_name}>{row.branch_name}</td>
                            <td className="px-3 py-3 text-sm text-gray-600">{row.unit || "-"}</td>
                            <td className="px-3 py-3 font-mono text-sm font-medium text-gray-700">{Number(row.system_quantity).toFixed(2)}</td>
                            <td className="px-3 py-3"><input type="number" step="0.01" min="0" value={entry.physical} onChange={(e) => updateCount(key, "physical", e.target.value)} className={`w-full rounded-lg border px-3 py-2 text-sm font-mono outline-none focus:ring-2 ${isChanged ? "border-amber-300 bg-amber-50 focus:border-amber-400 focus:ring-amber-100" : "border-gray-200 bg-white focus:border-pink-400 focus:ring-pink-100"}`} placeholder="0.00" /></td>
                            <td className={`px-3 py-3 font-mono text-sm font-bold ${diff === 0 ? "text-green-600" : diff < 0 ? "text-red-600" : "text-orange-500"}`}>{diff > 0 ? "+" : ""}{diff.toFixed(2)}</td>
                            <td className="px-3 py-3"><span className={`inline-flex w-[85px] justify-center rounded-full border px-2.5 py-1 text-[10px] font-bold ${v.cls}`}>{v.label}</span></td>
                            <td className="px-3 py-3"><button onClick={() => reconcileSingle(row)} disabled={saving || entry.physical === "" || !Number.isFinite(Number(entry.physical))} className={`w-full rounded-lg px-3 py-2 text-xs font-semibold transition ${isChanged ? "bg-[#26395d] text-white hover:bg-black disabled:opacity-40" : "bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-40"}`}>{saving ? "..." : isChanged ? "Save" : "Confirm"}</button></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="mb-4 flex flex-col sm:flex-row gap-3 justify-between">
              <div className="relative max-w-sm flex-1"><span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span><input value={historySearch} onChange={(e) => setHistorySearch(e.target.value)} placeholder="Search history: ingredient, reason..." className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-pink-400 focus:ring-2 focus:ring-pink-100" /></div>
              <div className="flex gap-2"><button onClick={loadHistory} disabled={historyLoading} className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50">{historyLoading ? "Loading..." : "↻ Refresh History"}</button><button onClick={() => { setHistorySearch(""); loadHistory(); }} className="rounded-xl bg-white border border-gray-200 px-4 py-2.5 text-sm font-medium">Clear</button></div>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <div className="p-5 border-b border-gray-100 flex justify-between items-center"><div><h2 className="text-lg font-bold text-[#26395d]">Reconciliation History</h2><p className="text-sm text-gray-500">Last 100 adjustments • newest first</p></div><span className="text-sm text-gray-500">{filteredHistory.length} record(s)</span></div>
              {historyLoading ? <div className="py-16 text-center"><div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#26395d]"></div><p className="mt-3 text-sm text-gray-500">Loading history...</p></div> : filteredHistory.length === 0 ? <div className="py-16 text-center"><div className="text-4xl mb-3">🕘</div><h3 className="font-semibold text-gray-700">No reconciliation records yet</h3><p className="text-sm text-gray-500 mt-1">Complete a count on the Count Sheet tab to create history.</p></div> : (
                <div className="overflow-x-auto max-h-[560px] overflow-y-auto">
                  <table className="w-full min-w-[1000px] table-fixed border-collapse">
                    <colgroup><col className="w-[150px]" /><col className="w-[180px]" /><col className="w-[200px]" /><col className="w-[110px]" /><col className="w-[120px]" /><col className="w-[120px]" /></colgroup>
                    <thead className="sticky top-0 z-10 bg-gray-50"><tr className="border-b border-gray-200"><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Date</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Ingredient / Branch</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Counts</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Variance</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">Reason</th><th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">By</th></tr></thead>
                    <tbody>
                      {filteredHistory.map((h) => {
                        const diff = Number(h.difference); const v = getVarianceStatus(diff);
                        return (
                          <tr key={h.id} className="border-b border-gray-100 bg-white hover:bg-gray-50">
                            <td className="px-4 py-3 text-xs text-gray-600"><div className="font-medium text-gray-800">{new Date(h.created_at).toLocaleDateString()}</div><div className="text-gray-400">{new Date(h.created_at).toLocaleTimeString()}</div></td>
                            <td className="px-4 py-3"><div className="font-semibold text-gray-800 truncate text-sm" title={h.ingredient_name}>{h.ingredient_name}</div><div className="text-xs text-gray-500 truncate">📍 {h.branch_name} • {h.unit}</div></td>
                            <td className="px-4 py-3 text-xs font-mono"><span className="text-gray-500">Sys:</span> <span className="font-semibold">{Number(h.system_quantity).toFixed(2)}</span> <span className="text-gray-400">→</span> <span className="text-gray-500">Phys:</span> <span className="font-semibold">{Number(h.physical_quantity).toFixed(2)}</span></td>
                            <td className="px-4 py-3"><div className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-bold ${v.cls}`}>{diff > 0 ? "+" : ""}{diff.toFixed(2)} {h.unit}</div><div className="text-[10px] text-gray-400 mt-1">{v.label}</div></td>
                            <td className="px-4 py-3 text-xs text-gray-700 truncate" title={h.reason}>{h.reason || "-"}</td>
                            <td className="px-4 py-3 text-xs text-gray-500">{h.created_by_name || (h.created_by ? `User #${h.created_by}` : "-")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">Taste It Café • Reconciliation • Physical count truth is system truth after saving</div>
      </main>
    </div>
  );
}

export default Reconciliation;
