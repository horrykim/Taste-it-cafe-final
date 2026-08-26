const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// GET RECONCILIATION SHEET
// GET /api/reconciliation/sheet?branch_id=1
// Returns inventory with system qty ready to reconcile
// ======================================================
router.get("/sheet", authenticateToken, async (req, res) => {
  try {
    const { branch_id } = req.query;

    let query = `
      SELECT
        i.id AS inventory_id,
        i.branch_id,
        b.branch_name,
        b.location,
        i.ingredient_id,
        ing.ingredient_name,
        ing.unit,
        i.quantity AS system_quantity,
        i.low_stock_level,
        i.updated_at,
        CASE
          WHEN i.quantity <= 0 THEN 'out_of_stock'
          WHEN i.quantity <= i.low_stock_level THEN 'low_stock'
          ELSE 'available'
        END AS stock_status
      FROM inventory i
      INNER JOIN branches b ON i.branch_id = b.id
      INNER JOIN ingredients ing ON i.ingredient_id = ing.id
    `;

    const values = [];
    if (branch_id && branch_id !== "all") {
      if (!/^\d+$/.test(String(branch_id))) {
        return res.status(400).json({ success: false, message: "Invalid branch ID." });
      }
      // enforce branch access for non-owner
      if (req.user.role !== "owner" && Number(branch_id) !== Number(req.user.branchId)) {
        return res.status(403).json({ success: false, message: "You do not have permission to access this branch." });
      }
      values.push(Number(branch_id));
      query += ` WHERE i.branch_id = $1 `;
    } else if (req.user.role !== "owner") {
      // cashier/staff locked to own branch when "all"
      values.push(Number(req.user.branchId));
      query += ` WHERE i.branch_id = $1 `;
    }

    query += ` ORDER BY ing.ingredient_name ASC `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      sheet: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET RECONCILIATION SHEET ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load reconciliation sheet.", error: error.message });
  }
});

// ======================================================
// GET RECONCILIATION HISTORY
// GET /api/reconciliation/history?branch_id=1&limit=50&search=
// ======================================================
router.get("/history", authenticateToken, async (req, res) => {
  try {
    const { branch_id, limit, search } = req.query;

    let query = `
      SELECT
        ia.id,
        ia.branch_id,
        b.branch_name,
        b.location,
        ia.ingredient_id,
        ing.ingredient_name,
        ing.unit,
        ia.system_quantity,
        ia.physical_quantity,
        ia.difference,
        ia.reason,
        ia.created_at,
        ia.created_by,
        u.full_name AS created_by_name
      FROM inventory_adjustments ia
      INNER JOIN branches b ON ia.branch_id = b.id
      INNER JOIN ingredients ing ON ia.ingredient_id = ing.id
      LEFT JOIN users u ON ia.created_by = u.id
      WHERE 1=1
    `;

    const values = [];
    let idx = 1;

    if (branch_id && branch_id !== "all") {
      if (!/^\d+$/.test(String(branch_id))) {
        return res.status(400).json({ success: false, message: "Invalid branch ID." });
      }
      if (req.user.role !== "owner" && Number(branch_id) !== Number(req.user.branchId)) {
        return res.status(403).json({ success: false, message: "You do not have permission to access this branch." });
      }
      query += ` AND ia.branch_id = $${idx}`;
      values.push(Number(branch_id));
      idx++;
    } else if (req.user.role !== "owner") {
      query += ` AND ia.branch_id = $${idx}`;
      values.push(Number(req.user.branchId));
      idx++;
    }

    if (search && String(search).trim()) {
      query += ` AND (LOWER(ing.ingredient_name) LIKE $${idx} OR LOWER(ia.reason) LIKE $${idx})`;
      values.push(`%${String(search).trim().toLowerCase()}%`);
      idx++;
    }

    query += ` ORDER BY ia.created_at DESC, ia.id DESC `;

    const lim = Math.min(Math.max(parseInt(limit) || 100, 1), 500);
    query += ` LIMIT $${idx}`;
    values.push(lim);

    const result = await pool.query(query, values);

    res.json({
      success: true,
      history: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET RECONCILIATION HISTORY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load reconciliation history.", error: error.message });
  }
});

// ======================================================
// GET RECONCILIATION STATS
// GET /api/reconciliation/stats?branch_id=1
// ======================================================
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const { branch_id } = req.query;
    let branchFilter = "";
    const values = [];
    let targetBranchId = null;

    if (branch_id && branch_id !== "all") {
      if (!/^\d+$/.test(String(branch_id))) {
        return res.status(400).json({ success: false, message: "Invalid branch ID." });
      }
      if (req.user.role !== "owner" && Number(branch_id) !== Number(req.user.branchId)) {
        return res.status(403).json({ success: false, message: "You do not have permission to access this branch." });
      }
      targetBranchId = Number(branch_id);
      branchFilter = "WHERE branch_id = $1";
      values.push(targetBranchId);
    } else if (req.user.role !== "owner") {
      targetBranchId = Number(req.user.branchId);
      branchFilter = "WHERE branch_id = $1";
      values.push(targetBranchId);
    }

    const invResult = await pool.query(
      `SELECT
        COUNT(*)::int AS total_items,
        COUNT(CASE WHEN quantity <= 0 THEN 1 END)::int AS out_of_stock,
        COUNT(CASE WHEN quantity > 0 AND quantity <= low_stock_level THEN 1 END)::int AS low_stock
       FROM inventory ${branchFilter}`,
      values
    );

    let adjQuery;
    let adjValues;
    if (branchFilter) {
      adjQuery = `SELECT
        COUNT(*)::int AS total_adjustments,
        COUNT(CASE WHEN difference < 0 THEN 1 END)::int AS shortage_count,
        COUNT(CASE WHEN difference > 0 THEN 1 END)::int AS overage_count,
        COUNT(CASE WHEN difference = 0 THEN 1 END)::int AS matched_count,
        COALESCE(SUM(CASE WHEN difference < 0 THEN difference END),0) AS total_shortage,
        COALESCE(SUM(CASE WHEN difference > 0 THEN difference END),0) AS total_overage
      FROM inventory_adjustments
      WHERE branch_id = $1 AND created_at >= NOW() - INTERVAL '30 days'`;
      adjValues = values;
    } else {
      adjQuery = `SELECT
        COUNT(*)::int AS total_adjustments,
        COUNT(CASE WHEN difference < 0 THEN 1 END)::int AS shortage_count,
        COUNT(CASE WHEN difference > 0 THEN 1 END)::int AS overage_count,
        COUNT(CASE WHEN difference = 0 THEN 1 END)::int AS matched_count,
        COALESCE(SUM(CASE WHEN difference < 0 THEN difference END),0) AS total_shortage,
        COALESCE(SUM(CASE WHEN difference > 0 THEN difference END),0) AS total_overage
      FROM inventory_adjustments
      WHERE created_at >= NOW() - INTERVAL '30 days'`;
      adjValues = [];
    }

    const adjResult = await pool.query(adjQuery, adjValues);

    const lastAdjQuery = `SELECT created_at FROM inventory_adjustments ${branchFilter} ORDER BY created_at DESC LIMIT 1`;
    const lastAdj = await pool.query(lastAdjQuery, values);

    res.json({
      success: true,
      stats: {
        inventory: invResult.rows[0],
        adjustments: adjResult.rows[0],
        last_reconciliation: lastAdj.rows[0]?.created_at || null,
      },
    });
  } catch (error) {
    console.error("GET RECONCILIATION STATS ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load reconciliation stats.", error: error.message });
  }
});

// ======================================================
// LEGACY COMPAT: GET /api/reconciliation?branch_id=1
// Keeps old frontend (GET /reconciliation) working
// Maps to sheet data with expected/actual alias
// ======================================================
router.get("/", authenticateToken, async (req, res) => {
  try {
    const { branch_id } = req.query;
    let query = `
      SELECT
        i.id AS inventory_id,
        i.branch_id,
        b.branch_name,
        b.location,
        i.ingredient_id,
        ing.ingredient_name,
        ing.unit,
        i.quantity AS system_quantity,
        i.quantity AS expected_quantity,
        i.quantity AS actual_quantity,
        i.low_stock_level,
        i.updated_at
      FROM inventory i
      INNER JOIN branches b ON i.branch_id = b.id
      INNER JOIN ingredients ing ON i.ingredient_id = ing.id
    `;
    const values = [];
    if (branch_id && branch_id !== "all") {
      if (!/^\d+$/.test(String(branch_id))) {
        return res.status(400).json({ success: false, message: "Invalid branch ID." });
      }
      if (req.user.role !== "owner" && Number(branch_id) !== Number(req.user.branchId)) {
        return res.status(403).json({ success: false, message: "You do not have permission to access this branch." });
      }
      values.push(Number(branch_id));
      query += ` WHERE i.branch_id = $1 `;
    } else if (req.user.role !== "owner") {
      values.push(Number(req.user.branchId));
      query += ` WHERE i.branch_id = $1 `;
    }
    query += ` ORDER BY ing.ingredient_name ASC `;
    const result = await pool.query(query, values);
    res.json({ success: true, reconciliation: result.rows, sheet: result.rows, count: result.rows.length });
  } catch (error) {
    console.error("GET RECONCILIATION LEGACY ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to load reconciliation.", error: error.message });
  }
});

// ======================================================
// CREATE SINGLE RECONCILIATION
// POST /api/reconciliation
// Body: { branch_id, ingredient_id, physical_quantity, reason }
// ======================================================
router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  let tx = false;
  try {
    const { branch_id, ingredient_id, physical_quantity, reason } = req.body;

    // Validation
    if (!branch_id) return res.status(400).json({ success: false, message: "Branch is required." });
    if (!ingredient_id) return res.status(400).json({ success: false, message: "Ingredient is required." });

    const physQty = Number(physical_quantity);
    if (physical_quantity === undefined || physical_quantity === "" || !Number.isFinite(physQty) || physQty < 0) {
      return res.status(400).json({ success: false, message: "Valid physical quantity is required." });
    }

    const branchIdNum = Number(branch_id);
    const ingredientIdNum = Number(ingredient_id);

    if (req.user.role !== "owner" && branchIdNum !== Number(req.user.branchId)) {
      return res.status(403).json({ success: false, message: "You can only reconcile your assigned branch." });
    }

    await client.query("BEGIN");
    tx = true;

    const invResult = await client.query(
      `SELECT id, quantity FROM inventory WHERE branch_id = $1 AND ingredient_id = $2 FOR UPDATE`,
      [branchIdNum, ingredientIdNum]
    );

    if (invResult.rows.length === 0) {
      await client.query("ROLLBACK");
      tx = false;
      return res.status(404).json({ success: false, message: "Inventory record not found for this branch and ingredient." });
    }

    const inventoryId = invResult.rows[0].id;
    const systemQty = Number(invResult.rows[0].quantity);
    const difference = physQty - systemQty;

    // Determine if inventory_adjustments has created_by column (try insert with it, fallback without)
    let adjustmentResult;
    try {
      adjustmentResult = await client.query(
        `INSERT INTO inventory_adjustments (branch_id, ingredient_id, system_quantity, physical_quantity, difference, reason, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [branchIdNum, ingredientIdNum, systemQty, physQty, difference, reason ? String(reason).trim() : null, req.user.userId]
      );
    } catch (colErr) {
      // fallback if created_by column doesn't exist
      if (colErr.message && colErr.message.includes("created_by")) {
        adjustmentResult = await client.query(
          `INSERT INTO inventory_adjustments (branch_id, ingredient_id, system_quantity, physical_quantity, difference, reason)
           VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
          [branchIdNum, ingredientIdNum, systemQty, physQty, difference, reason ? String(reason).trim() : null]
        );
      } else {
        throw colErr;
      }
    }

    await client.query(`UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE id = $2`, [physQty, inventoryId]);

    await client.query("COMMIT");
    tx = false;

    res.json({
      success: true,
      message: difference === 0 ? "Count matches system quantity. Inventory confirmed." : "Reconciliation saved and inventory updated.",
      adjustment: adjustmentResult.rows[0],
      system_quantity: systemQty,
      physical_quantity: physQty,
      difference,
    });
  } catch (error) {
    if (tx) {
      try { await client.query("ROLLBACK"); } catch (_) {}
    }
    console.error("CREATE RECONCILIATION ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to save reconciliation.", error: error.message });
  } finally {
    client.release();
  }
});

// ======================================================
// BULK RECONCILIATION
// POST /api/reconciliation/bulk
// Body: { branch_id, items: [{ ingredient_id, physical_quantity, reason }], default_reason }
// ======================================================
router.post("/bulk", authenticateToken, async (req, res) => {
  const client = await pool.connect();
  let tx = false;
  try {
    const { branch_id, items, default_reason } = req.body;

    if (!branch_id) return res.status(400).json({ success: false, message: "Branch is required." });
    const branchIdNum = Number(branch_id);
    if (req.user.role !== "owner" && branchIdNum !== Number(req.user.branchId)) {
      return res.status(403).json({ success: false, message: "You can only reconcile your assigned branch." });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: "At least one item is required." });
    }
    if (items.length > 100) {
      return res.status(400).json({ success: false, message: "Bulk limit is 100 items per request." });
    }

    await client.query("BEGIN");
    tx = true;

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const ingredientIdNum = Number(it.ingredient_id);
      const physQty = Number(it.physical_quantity);
      const reason = it.reason || default_reason || null;

      if (!ingredientIdNum || !Number.isInteger(ingredientIdNum) || ingredientIdNum <= 0) {
        errors.push({ index: i, ingredient_id: it.ingredient_id, message: "Invalid ingredient ID." });
        continue;
      }
      if (!Number.isFinite(physQty) || physQty < 0) {
        errors.push({ index: i, ingredient_id: ingredientIdNum, message: "Valid physical quantity is required." });
        continue;
      }

      const invResult = await client.query(
        `SELECT id, quantity FROM inventory WHERE branch_id = $1 AND ingredient_id = $2 FOR UPDATE`,
        [branchIdNum, ingredientIdNum]
      );

      if (invResult.rows.length === 0) {
        errors.push({ index: i, ingredient_id: ingredientIdNum, message: "Inventory record not found." });
        continue;
      }

      const inventoryId = invResult.rows[0].id;
      const systemQty = Number(invResult.rows[0].quantity);
      const difference = physQty - systemQty;

      let adjRow;
      try {
        const r = await client.query(
          `INSERT INTO inventory_adjustments (branch_id, ingredient_id, system_quantity, physical_quantity, difference, reason, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [branchIdNum, ingredientIdNum, systemQty, physQty, difference, reason ? String(reason).trim() : null, req.user.userId]
        );
        adjRow = r.rows[0];
      } catch (colErr) {
        if (colErr.message && colErr.message.includes("created_by")) {
          const r = await client.query(
            `INSERT INTO inventory_adjustments (branch_id, ingredient_id, system_quantity, physical_quantity, difference, reason)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [branchIdNum, ingredientIdNum, systemQty, physQty, difference, reason ? String(reason).trim() : null]
          );
          adjRow = r.rows[0];
        } else {
          throw colErr;
        }
      }

      await client.query(`UPDATE inventory SET quantity = $1, updated_at = NOW() WHERE id = $2`, [physQty, inventoryId]);

      results.push({
        ingredient_id: ingredientIdNum,
        system_quantity: systemQty,
        physical_quantity: physQty,
        difference,
        adjustment: adjRow,
      });
    }

    if (results.length === 0 && errors.length > 0) {
      await client.query("ROLLBACK");
      tx = false;
      return res.status(400).json({ success: false, message: "All items failed to reconcile.", errors });
    }

    await client.query("COMMIT");
    tx = false;

    res.json({
      success: true,
      message: `Reconciled ${results.length} item(s) successfully.` + (errors.length ? ` ${errors.length} failed.` : ""),
      reconciled: results,
      errors,
      count: results.length,
    });
  } catch (error) {
    if (tx) {
      try { await client.query("ROLLBACK"); } catch (_) {}
    }
    console.error("BULK RECONCILIATION ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to save bulk reconciliation.", error: error.message });
  } finally {
    client.release();
  }
});

module.exports = router;
