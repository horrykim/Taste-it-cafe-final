const express = require("express");
const router = express.Router();

const pool = require("../config/database");

// ==========================================
// GET ALL INVENTORY
// GET /api/inventory
// ==========================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        i.id,
        i.branch_id,
        b.branch_name,
        i.ingredient_id,
        ing.ingredient_name,
        ing.unit,
        i.quantity,
        i.low_stock_level,
        i.updated_at
      FROM inventory i
      LEFT JOIN branches b
        ON i.branch_id = b.id
      LEFT JOIN ingredients ing
        ON i.ingredient_id = ing.id
      ORDER BY i.id ASC
    `);

    res.json({
      success: true,
      inventory: result.rows,
    });

  } catch (error) {
    console.error("Get inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get inventory.",
    });
  }
});

// ==========================================
// GET ALL BRANCHES
// GET /api/inventory/branches
// IMPORTANT: Must be BEFORE /:id
// ==========================================
router.get("/branches", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        branch_name,
        location
      FROM branches
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      branches: result.rows,
    });

  } catch (error) {
    console.error("Get branches error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get branches.",
    });
  }
});

// ==========================================
// GET ALL INGREDIENTS
// GET /api/inventory/ingredients
// IMPORTANT: Must be BEFORE /:id
// ==========================================
router.get("/ingredients", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        ingredient_name,
        unit
      FROM ingredients
      ORDER BY id ASC
    `);

    res.json({
      success: true,
      ingredients: result.rows,
    });

  } catch (error) {
    console.error("Get ingredients error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get ingredients.",
    });
  }
});

// ==========================================
// GET INVENTORY BY ID
// GET /api/inventory/:id
// IMPORTANT: Keep this AFTER /branches and /ingredients
// ==========================================
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT
        i.id,
        i.branch_id,
        b.branch_name,
        i.ingredient_id,
        ing.ingredient_name,
        ing.unit,
        i.quantity,
        i.low_stock_level,
        i.updated_at
      FROM inventory i
      LEFT JOIN branches b
        ON i.branch_id = b.id
      LEFT JOIN ingredients ing
        ON i.ingredient_id = ing.id
      WHERE i.id = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    res.json({
      success: true,
      inventory: result.rows[0],
    });

  } catch (error) {
    console.error("Get inventory item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get inventory item.",
    });
  }
});

// ==========================================
// ADD INVENTORY
// POST /api/inventory
// ==========================================
router.post("/", async (req, res) => {
  try {
    const {
      branch_id,
      ingredient_id,
      quantity,
      low_stock_level,
    } = req.body;

    if (
      branch_id === undefined ||
      ingredient_id === undefined ||
      quantity === undefined ||
      low_stock_level === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "branch_id, ingredient_id, quantity, and low_stock_level are required.",
      });
    }

    if (Number(quantity) < 0 || Number(low_stock_level) < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity and low stock level cannot be negative.",
      });
    }

    const result = await pool.query(`
      INSERT INTO inventory (
        branch_id,
        ingredient_id,
        quantity,
        low_stock_level
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [
      branch_id,
      ingredient_id,
      quantity,
      low_stock_level,
    ]);

    res.status(201).json({
      success: true,
      message: "Inventory item added successfully.",
      inventory: result.rows[0],
    });

  } catch (error) {
    console.error("Add inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add inventory item.",
    });
  }
});

// ==========================================
// UPDATE INVENTORY
// PUT /api/inventory/:id
// ==========================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      branch_id,
      ingredient_id,
      quantity,
      low_stock_level,
    } = req.body;

    if (
      branch_id === undefined ||
      ingredient_id === undefined ||
      quantity === undefined ||
      low_stock_level === undefined
    ) {
      return res.status(400).json({
        success: false,
        message:
          "branch_id, ingredient_id, quantity, and low_stock_level are required.",
      });
    }

    if (Number(quantity) < 0 || Number(low_stock_level) < 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity and low stock level cannot be negative.",
      });
    }

    const result = await pool.query(`
      UPDATE inventory
      SET
        branch_id = $1,
        ingredient_id = $2,
        quantity = $3,
        low_stock_level = $4,
        updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [
      branch_id,
      ingredient_id,
      quantity,
      low_stock_level,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    res.json({
      success: true,
      message: "Inventory item updated successfully.",
      inventory: result.rows[0],
    });

  } catch (error) {
    console.error("Update inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update inventory item.",
    });
  }
});

// ==========================================
// DELETE INVENTORY
// DELETE /api/inventory/:id
// ==========================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      DELETE FROM inventory
      WHERE id = $1
      RETURNING *
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Inventory item not found.",
      });
    }

    res.json({
      success: true,
      message: "Inventory item deleted successfully.",
    });

  } catch (error) {
    console.error("Delete inventory error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete inventory item.",
    });
  }
});

module.exports = router;