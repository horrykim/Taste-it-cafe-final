const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ======================================================
// GET ALL INGREDIENTS
// GET /api/ingredients
// ======================================================

router.get("/", async (req, res) => {
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
      message: "Failed to load ingredients.",
      error: error.message,
    });
  }
});

// ======================================================
// CREATE INGREDIENT
// POST /api/ingredients
// ======================================================

router.post("/", async (req, res) => {
  try {
    const { ingredient_name, unit } = req.body;

    // -----------------------------
    // VALIDATION
    // -----------------------------

    if (!ingredient_name || !ingredient_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ingredient name is required.",
      });
    }

    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit is required.",
      });
    }

    const name = ingredient_name.trim();
    const ingredientUnit = unit.trim();

    // -----------------------------
    // CHECK DUPLICATE
    // -----------------------------

    const existing = await pool.query(
      `
      SELECT id
      FROM ingredients
      WHERE LOWER(ingredient_name) = LOWER($1)
      `,
      [name]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: "This ingredient already exists.",
      });
    }

    // -----------------------------
    // CREATE
    // -----------------------------

    const result = await pool.query(
      `
      INSERT INTO ingredients (
        ingredient_name,
        unit
      )
      VALUES ($1, $2)
      RETURNING
        id,
        ingredient_name,
        unit
      `,
      [
        name,
        ingredientUnit,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Ingredient created successfully.",
      ingredient: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE INGREDIENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create ingredient.",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE INGREDIENT
// PUT /api/ingredients/:id
// ======================================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { ingredient_name, unit } = req.body;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ingredient ID.",
      });
    }

    if (!ingredient_name || !ingredient_name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Ingredient name is required.",
      });
    }

    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit is required.",
      });
    }

    const result = await pool.query(
      `
      UPDATE ingredients
      SET
        ingredient_name = $1,
        unit = $2
      WHERE id = $3
      RETURNING
        id,
        ingredient_name,
        unit
      `,
      [
        ingredient_name.trim(),
        unit.trim(),
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ingredient not found.",
      });
    }

    res.json({
      success: true,
      message: "Ingredient updated successfully.",
      ingredient: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE INGREDIENT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update ingredient.",
      error: error.message,
    });
  }
});

// ======================================================
// DELETE INGREDIENT
// DELETE /api/ingredients/:id
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ingredient ID.",
      });
    }

    const result = await pool.query(
      `
      DELETE FROM ingredients
      WHERE id = $1
      RETURNING id, ingredient_name, unit
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Ingredient not found.",
      });
    }

    res.json({
      success: true,
      message: "Ingredient deleted successfully.",
      ingredient: result.rows[0],
    });
  } catch (error) {
    console.error("DELETE INGREDIENT ERROR:", error);

    // Foreign-key protection
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient cannot be deleted because it is already being used by inventory or another record.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete ingredient.",
      error: error.message,
    });
  }
});

module.exports = router;