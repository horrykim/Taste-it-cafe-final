const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ======================================================
// GET ALL RECIPES
// ======================================================
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        r.id,
        r.menu_item_id,
        m.name AS menu_item_name,
        r.ingredient_id,
        i.ingredient_name,
        i.unit,
        r.quantity_required
      FROM recipes r
      INNER JOIN menu_items m
        ON r.menu_item_id = m.id
      INNER JOIN ingredients i
        ON r.ingredient_id = i.id
      ORDER BY r.menu_item_id, r.id
    `);

    res.json({
      success: true,
      recipes: result.rows,
    });
  } catch (error) {
    console.error("GET ALL RECIPES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load recipes.",
      error: error.message,
    });
  }
});

// ======================================================
// GET RECIPE BY MENU ITEM
// ======================================================
router.get("/menu/:menuItemId", async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const result = await pool.query(
      `
      SELECT
        r.id,
        r.menu_item_id,
        r.ingredient_id,
        r.quantity_required,
        i.ingredient_name,
        i.unit
      FROM recipes r
      INNER JOIN ingredients i
        ON r.ingredient_id = i.id
      WHERE r.menu_item_id = $1
      ORDER BY r.id
      `,
      [menuItemId]
    );

    res.json({
      success: true,
      recipes: result.rows,
    });
  } catch (error) {
    console.error("GET RECIPE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to load recipe.",
      error: error.message,
    });
  }
});

// ======================================================
// ADD INGREDIENT TO RECIPE
// ======================================================
router.post("/", async (req, res) => {
  try {
    const {
      menu_item_id,
      ingredient_id,
      quantity_required,
    } = req.body;

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!menu_item_id) {
      return res.status(400).json({
        success: false,
        message: "Menu item is required.",
      });
    }

    if (!ingredient_id) {
      return res.status(400).json({
        success: false,
        message: "Ingredient is required.",
      });
    }

    const quantity = Number(quantity_required);

    if (
      quantity_required === undefined ||
      quantity_required === null ||
      quantity_required === "" ||
      !Number.isFinite(quantity) ||
      quantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be greater than 0.",
      });
    }

    // -----------------------------
    // CHECK DUPLICATE
    // -----------------------------
    const duplicate = await pool.query(
      `
      SELECT id
      FROM recipes
      WHERE menu_item_id = $1
      AND ingredient_id = $2
      `,
      [
        Number(menu_item_id),
        Number(ingredient_id),
      ]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient is already included in this recipe.",
      });
    }

    // -----------------------------
    // INSERT
    // -----------------------------
    const result = await pool.query(
      `
      INSERT INTO recipes (
        menu_item_id,
        ingredient_id,
        quantity_required
      )
      VALUES ($1, $2, $3)
      RETURNING *
      `,
      [
        Number(menu_item_id),
        Number(ingredient_id),
        quantity,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Ingredient added to recipe.",
      recipe: result.rows[0],
    });
  } catch (error) {
    console.error("ADD RECIPE ERROR:", error);

    if (error.code === "23503") {
      return res.status(400).json({
        success: false,
        message:
          "Invalid menu item or ingredient.",
      });
    }

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient is already included in this recipe.",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Unable to add ingredient to recipe.",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE RECIPE INGREDIENT
// ======================================================
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      menu_item_id,
      ingredient_id,
      quantity_required,
    } = req.body;

    // -----------------------------
    // CHECK EXISTING
    // -----------------------------
    const existing = await pool.query(
      `
      SELECT *
      FROM recipes
      WHERE id = $1
      `,
      [id]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recipe ingredient not found.",
      });
    }

    const current = existing.rows[0];

    // -----------------------------
    // KEEP OLD VALUES
    // -----------------------------
    const updatedMenuItemId =
      menu_item_id !== undefined
        ? Number(menu_item_id)
        : current.menu_item_id;

    const updatedIngredientId =
      ingredient_id !== undefined
        ? Number(ingredient_id)
        : current.ingredient_id;

    const updatedQuantity =
      quantity_required !== undefined
        ? Number(quantity_required)
        : Number(current.quantity_required);

    // -----------------------------
    // VALIDATION
    // -----------------------------
    if (!updatedMenuItemId) {
      return res.status(400).json({
        success: false,
        message: "Menu item is required.",
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
      updatedQuantity <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Quantity must be greater than 0.",
      });
    }

    // -----------------------------
    // CHECK DUPLICATE
    // -----------------------------
    const duplicate = await pool.query(
      `
      SELECT id
      FROM recipes
      WHERE menu_item_id = $1
      AND ingredient_id = $2
      AND id <> $3
      `,
      [
        updatedMenuItemId,
        updatedIngredientId,
        id,
      ]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message:
          "This ingredient is already included in this recipe.",
      });
    }

    // -----------------------------
    // UPDATE
    // -----------------------------
    const result = await pool.query(
      `
      UPDATE recipes
      SET
        menu_item_id = $1,
        ingredient_id = $2,
        quantity_required = $3
      WHERE id = $4
      RETURNING *
      `,
      [
        updatedMenuItemId,
        updatedIngredientId,
        updatedQuantity,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Recipe updated successfully.",
      recipe: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE RECIPE ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Unable to update recipe.",
      error: error.message,
    });
  }
});

// ======================================================
// DELETE RECIPE INGREDIENT
// ======================================================
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      DELETE FROM recipes
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Recipe ingredient not found.",
      });
    }

    res.json({
      success: true,
      message: "Ingredient removed from recipe.",
      deletedRecipe: result.rows[0],
    });
  } catch (error) {
    console.error(
      "DELETE RECIPE ERROR:",
      error
    );

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This recipe ingredient cannot be deleted because it is being used by another record.",
      });
    }

    res.status(500).json({
      success: false,
      message:
        "Unable to remove ingredient.",
      error: error.message,
    });
  }
});

module.exports = router;