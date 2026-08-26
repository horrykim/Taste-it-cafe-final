const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ======================================================
// GET ALL INVENTORY
// GET /api/inventory
// Optional:
// GET /api/inventory?branch_id=1
// ======================================================

router.get("/", async (req, res) => {
  try {
    const { branch_id } = req.query;

    let query = `
      SELECT
        i.id,
        i.branch_id,
        b.branch_name,
        b.location,
        i.ingredient_id,
        ing.ingredient_name,
        ing.unit,
        i.quantity,
        i.low_stock_level,
        i.updated_at,

        CASE
          WHEN i.quantity <= 0 THEN 'out_of_stock'
          WHEN i.quantity <= i.low_stock_level THEN 'low_stock'
          ELSE 'available'
        END AS stock_status

      FROM inventory i

      INNER JOIN branches b
        ON i.branch_id = b.id

      INNER JOIN ingredients ing
        ON i.ingredient_id = ing.id
    `;

    const values = [];

    // Filter by branch if supplied
    if (branch_id && branch_id !== "all") {
      if (!/^\d+$/.test(String(branch_id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch ID.",
        });
      }

      values.push(Number(branch_id));
      query += ` WHERE i.branch_id = $1 `;
    }

    query += `
      ORDER BY
        b.branch_name ASC,
        ing.ingredient_name ASC
    `;

    const result = await pool.query(query, values);

    res.json({
      success: true,
      inventory: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    console.error("GET INVENTORY ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get inventory.",
      error: error.message,
    });
  }
});

// ======================================================
// GET INVENTORY STATISTICS
// GET /api/inventory/stats
// Optional:
// GET /api/inventory/stats?branch_id=1
// ======================================================

router.get("/stats", async (req, res) => {
  try {
    const { branch_id } = req.query;

    const values = [];
    let whereClause = "";

    if (branch_id && branch_id !== "all") {
      if (!/^\d+$/.test(String(branch_id))) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch ID.",
        });
      }

      values.push(Number(branch_id));
      whereClause = "WHERE branch_id = $1";
    }

    const result = await pool.query(
      `
      SELECT
        COUNT(*)::int AS total_records,

        COUNT(
          CASE
            WHEN quantity > low_stock_level
            THEN 1
          END
        )::int AS available,

        COUNT(
          CASE
            WHEN quantity > 0
            AND quantity <= low_stock_level
            THEN 1
          END
        )::int AS low_stock,

        COUNT(
          CASE
            WHEN quantity <= 0
            THEN 1
          END
        )::int AS out_of_stock

      FROM inventory
      ${whereClause}
      `,
      values
    );

    res.json({
      success: true,
      stats: result.rows[0],
    });
  } catch (error) {
    console.error("GET INVENTORY STATS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get inventory statistics.",
      error: error.message,
    });
  }
});

// ======================================================
// GET ALL BRANCHES
//
// Supports BOTH:
// /api/inventory/branches
// /api/inventory/branches/list
//
// IMPORTANT:
// Must be before /:id
// ======================================================

const getBranches = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        branch_name,
        location
      FROM branches
      ORDER BY branch_name ASC
    `);

    res.json({
      success: true,
      branches: result.rows,
    });
  } catch (error) {
    console.error("GET BRANCHES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get branches.",
      error: error.message,
    });
  }
};

router.get("/branches", getBranches);
router.get("/branches/list", getBranches);

// ======================================================
// GET ALL INGREDIENTS
//
// Supports BOTH:
// /api/inventory/ingredients
// /api/inventory/ingredients/list
//
// IMPORTANT:
// Must be before /:id
// ======================================================

const getIngredients = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        ingredient_name,
        unit
      FROM ingredients
      ORDER BY ingredient_name ASC
    `);

    res.json({
      success: true,
      ingredients: result.rows,
    });
  } catch (error) {
    console.error("GET INGREDIENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get ingredients.",
      error: error.message,
    });
  }
};

router.get("/ingredients", getIngredients);
router.get("/ingredients/list", getIngredients);

// ======================================================
// GET INVENTORY ADJUSTMENTS
// GET /api/inventory/adjustments
// GET /api/inventory/adjustments/list
// ======================================================

const getAdjustments = async (req, res) => {
  try {
    const result = await pool.query(`
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
        ia.created_at

      FROM inventory_adjustments ia

      INNER JOIN branches b
        ON ia.branch_id = b.id

      INNER JOIN ingredients ing
        ON ia.ingredient_id = ing.id

      ORDER BY ia.id DESC
    `);

    res.json({
      success: true,
      adjustments: result.rows,
    });
  } catch (error) {
    console.error("GET ADJUSTMENTS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get inventory adjustments.",
      error: error.message,
    });
  }
};

router.get("/adjustments", getAdjustments);
router.get("/adjustments/list", getAdjustments);

// ======================================================
// CREATE INVENTORY
// POST /api/inventory
// ======================================================

router.post("/", async (req, res) => {
  try {
    const {
      branch_id,
      ingredient_id,
      quantity,
      low_stock_level,
    } = req.body;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!branch_id) {
      return res.status(400).json({
        success: false,
        message: "Branch is required.",
      });
    }

    if (!ingredient_id) {
      return res.status(400).json({
        success: false,
        message: "Ingredient is required.",
      });
    }

    const numericQuantity = Number(quantity);
    const numericLowStock = Number(low_stock_level);

    if (
      quantity === undefined ||
      quantity === null ||
      quantity === "" ||
      !Number.isFinite(numericQuantity) ||
      numericQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required.",
      });
    }

    if (
      low_stock_level === undefined ||
      low_stock_level === null ||
      low_stock_level === "" ||
      !Number.isFinite(numericLowStock) ||
      numericLowStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid low stock level is required.",
      });
    }

    // -----------------------------
    // CHECK DUPLICATE
    // -----------------------------

    const existing = await pool.query(
      `
      SELECT id
      FROM inventory
      WHERE branch_id = $1
      AND ingredient_id = $2
      `,
      [
        Number(branch_id),
        Number(ingredient_id),
      ]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient already exists in this branch's inventory.",
      });
    }

    // -----------------------------
    // INSERT
    // -----------------------------

    const result = await pool.query(
      `
      INSERT INTO inventory (
        branch_id,
        ingredient_id,
        quantity,
        low_stock_level,
        updated_at
      )
      VALUES ($1, $2, $3, $4, NOW())
      RETURNING *
      `,
      [
        Number(branch_id),
        Number(ingredient_id),
        numericQuantity,
        numericLowStock,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Inventory item added successfully.",
      inventory: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE INVENTORY ERROR:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid branch or ingredient.",
        error: error.detail,
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient already exists in this branch's inventory.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add inventory item.",
      error: error.message,
    });
  }
});

// ======================================================
// CREATE INVENTORY ADJUSTMENT
// POST /api/inventory/adjustments
// ======================================================

router.post("/adjustments", async (req, res) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const {
      branch_id,
      ingredient_id,
      physical_quantity,
      reason,
    } = req.body;

    if (!branch_id) {
      return res.status(400).json({
        success: false,
        message: "Branch is required.",
      });
    }

    if (!ingredient_id) {
      return res.status(400).json({
        success: false,
        message: "Ingredient is required.",
      });
    }

    const physicalQuantity = Number(
      physical_quantity
    );

    if (
      physical_quantity === undefined ||
      physical_quantity === null ||
      physical_quantity === "" ||
      !Number.isFinite(physicalQuantity) ||
      physicalQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid physical quantity is required.",
      });
    }

    // -----------------------------
    // START TRANSACTION
    // -----------------------------

    await client.query("BEGIN");
    transactionStarted = true;

    // -----------------------------
    // GET CURRENT INVENTORY
    // LOCK ROW
    // -----------------------------

    const inventoryResult = await client.query(
      `
      SELECT
        id,
        quantity
      FROM inventory
      WHERE branch_id = $1
      AND ingredient_id = $2
      FOR UPDATE
      `,
      [
        Number(branch_id),
        Number(ingredient_id),
      ]
    );

    if (inventoryResult.rows.length === 0) {
      await client.query("ROLLBACK");
      transactionStarted = false;

      return res.status(404).json({
        success: false,
        message:
          "Inventory record not found for this branch and ingredient.",
      });
    }

    const inventoryId =
      inventoryResult.rows[0].id;

    const systemQuantity = Number(
      inventoryResult.rows[0].quantity
    );

    // -----------------------------
    // CALCULATE DIFFERENCE
    // -----------------------------

    const difference =
      physicalQuantity - systemQuantity;

    // -----------------------------
    // SAVE ADJUSTMENT
    // -----------------------------

    const adjustmentResult =
      await client.query(
        `
        INSERT INTO inventory_adjustments (
          branch_id,
          ingredient_id,
          system_quantity,
          physical_quantity,
          difference,
          reason
        )
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
        `,
        [
          Number(branch_id),
          Number(ingredient_id),
          systemQuantity,
          physicalQuantity,
          difference,
          reason &&
          String(reason).trim()
            ? String(reason).trim()
            : null,
        ]
      );

    // -----------------------------
    // UPDATE INVENTORY
    // -----------------------------

    await client.query(
      `
      UPDATE inventory
      SET
        quantity = $1,
        updated_at = NOW()
      WHERE id = $2
      `,
      [
        physicalQuantity,
        inventoryId,
      ]
    );

    // -----------------------------
    // COMMIT
    // -----------------------------

    await client.query("COMMIT");
    transactionStarted = false;

    res.json({
      success: true,
      message:
        "Inventory adjustment completed successfully.",
      adjustment:
        adjustmentResult.rows[0],
    });
  } catch (error) {
    if (transactionStarted) {
      try {
        await client.query("ROLLBACK");
      } catch (rollbackError) {
        console.error(
          "ROLLBACK ERROR:",
          rollbackError
        );
      }
    }

    console.error(
      "CREATE INVENTORY ADJUSTMENT ERROR:",
      error
    );

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid branch or ingredient.",
        error: error.detail,
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to create inventory adjustment.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// GET INVENTORY BY ID
// GET /api/inventory/:id
//
// IMPORTANT:
// Keep this AFTER all specific routes.
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory ID.",
      });
    }

    const result = await pool.query(
      `
      SELECT
        i.id,
        i.branch_id,
        b.branch_name,
        b.location,
        i.ingredient_id,
        ing.ingredient_name,
        ing.unit,
        i.quantity,
        i.low_stock_level,
        i.updated_at,

        CASE
          WHEN i.quantity <= 0 THEN 'out_of_stock'
          WHEN i.quantity <= i.low_stock_level THEN 'low_stock'
          ELSE 'available'
        END AS stock_status

      FROM inventory i

      INNER JOIN branches b
        ON i.branch_id = b.id

      INNER JOIN ingredients ing
        ON i.ingredient_id = ing.id

      WHERE i.id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found.",
      });
    }

    res.json({
      success: true,
      inventory: result.rows[0],
    });
  } catch (error) {
    console.error(
      "GET INVENTORY ITEM ERROR:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to get inventory item.",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE INVENTORY
// PUT /api/inventory/:id
// ======================================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory ID.",
      });
    }

    const {
      branch_id,
      ingredient_id,
      quantity,
      low_stock_level,
    } = req.body;

    // -----------------------------
    // GET EXISTING RECORD
    // -----------------------------

    const existing = await pool.query(
      `
      SELECT *
      FROM inventory
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found.",
      });
    }

    const current = existing.rows[0];

    // -----------------------------
    // KEEP OLD VALUES IF MISSING
    // -----------------------------

    const updatedBranchId =
      branch_id !== undefined
        ? Number(branch_id)
        : Number(current.branch_id);

    const updatedIngredientId =
      ingredient_id !== undefined
        ? Number(ingredient_id)
        : Number(current.ingredient_id);

    const updatedQuantity =
      quantity !== undefined
        ? Number(quantity)
        : Number(current.quantity);

    const updatedLowStock =
      low_stock_level !== undefined
        ? Number(low_stock_level)
        : Number(current.low_stock_level);

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!updatedBranchId) {
      return res.status(400).json({
        success: false,
        message: "Branch is required.",
      });
    }

    if (!updatedIngredientId) {
      return res.status(400).json({
        success: false,
        message: "Ingredient is required.",
      });
    }

    if (
      !Number.isFinite(updatedQuantity) ||
      updatedQuantity < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid quantity is required.",
      });
    }

    if (
      !Number.isFinite(updatedLowStock) ||
      updatedLowStock < 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid low stock level is required.",
      });
    }

    // -----------------------------
    // CHECK DUPLICATE
    // -----------------------------

    const duplicate = await pool.query(
      `
      SELECT id
      FROM inventory
      WHERE branch_id = $1
      AND ingredient_id = $2
      AND id <> $3
      `,
      [
        updatedBranchId,
        updatedIngredientId,
        id,
      ]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient already exists in this branch's inventory.",
      });
    }

    // -----------------------------
    // UPDATE
    // -----------------------------

    const result = await pool.query(
      `
      UPDATE inventory
      SET
        branch_id = $1,
        ingredient_id = $2,
        quantity = $3,
        low_stock_level = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
      `,
      [
        updatedBranchId,
        updatedIngredientId,
        updatedQuantity,
        updatedLowStock,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Inventory updated successfully.",
      inventory: result.rows[0],
    });
  } catch (error) {
    console.error(
      "UPDATE INVENTORY ERROR:",
      error
    );

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message: "Invalid branch or ingredient.",
        error: error.detail,
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient already exists in this branch's inventory.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update inventory.",
      error: error.message,
    });
  }
});

// ======================================================
// DELETE INVENTORY
// DELETE /api/inventory/:id
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid inventory ID.",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM inventory
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory record not found.",
      });
    }

    res.json({
      success: true,
      message:
        "Inventory item deleted successfully.",
      deletedItem: result.rows[0],
    });
  } catch (error) {
    console.error(
      "DELETE INVENTORY ERROR:",
      error
    );

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This inventory item cannot be deleted because it is being used by another record.",
        error: error.detail,
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Failed to delete inventory item.",
      error: error.message,
    });
  }
});

// ======================================================
// EXPORT
// ======================================================

module.exports = router;