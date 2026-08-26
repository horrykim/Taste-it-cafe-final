const express = require("express");
const router = express.Router();
const pool = require("../config/database");

// ======================================================
// GET ALL MENU ITEMS
// ======================================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        item_name,
        description,
        category,
        price,
        status,
        image_url,
        created_at,
        updated_at
      FROM menu_items
      ORDER BY id DESC
    `);

    res.json({
      success: true,
      menuItems: result.rows,
    });
  } catch (error) {
    console.error("Get menu items error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get menu items.",
      error: error.message,
    });
  }
});

// ======================================================
// GET MENU ITEM BY ID
// ======================================================

router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT
        id,
        item_name,
        description,
        category,
        price,
        status,
        image_url,
        created_at,
        updated_at
      FROM menu_items
      WHERE id = $1
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    res.json({
      success: true,
      menuItem: result.rows[0],
    });
  } catch (error) {
    console.error("Get menu item error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get menu item.",
      error: error.message,
    });
  }
});

// ======================================================
// GET RECIPE FOR MENU ITEM
// ======================================================

router.get("/:id/recipe", async (req, res) => {
  try {
    const { id } = req.params;

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
      LEFT JOIN ingredients i
        ON i.id = r.ingredient_id
      WHERE r.menu_item_id = $1
      ORDER BY r.id ASC
      `,
      [id]
    );

    res.json({
      success: true,
      recipeItems: result.rows,
    });
  } catch (error) {
    console.error("Get recipe error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get recipe.",
      error: error.message,
    });
  }
});

// ======================================================
// CREATE MENU ITEM
// ======================================================

router.post("/", async (req, res) => {
  try {
    const {
      item_name,
      description,
      category,
      price,
      status,
      image_url,
    } = req.body;

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!item_name || !String(item_name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Item name is required.",
      });
    }

    if (!category || !String(category).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (
      price === undefined ||
      price === null ||
      price === "" ||
      !Number.isFinite(Number(price)) ||
      Number(price) < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required.",
      });
    }

    const allowedStatuses = ["available", "unavailable"];

    const cleanStatus = status || "available";

    if (!allowedStatuses.includes(cleanStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item status.",
      });
    }

    // --------------------------------------------------
    // IMAGE
    // --------------------------------------------------

    const cleanImageUrl =
      image_url && String(image_url).trim()
        ? String(image_url).trim()
        : null;

    // --------------------------------------------------
    // INSERT
    // --------------------------------------------------

    const result = await pool.query(
      `
      INSERT INTO menu_items (
        item_name,
        description,
        category,
        price,
        status,
        image_url
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
      `,
      [
        String(item_name).trim(),

        description &&
        String(description).trim()
          ? String(description).trim()
          : null,

        String(category).trim(),

        Number(price),

        cleanStatus,

        cleanImageUrl,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Menu item added successfully.",
      menuItem: result.rows[0],
      menuItemId: result.rows[0].id,
    });
  } catch (error) {
    console.error("Create menu item error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A menu item with this information already exists.",
        error: error.detail,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to add menu item.",
      error: error.message,
    });
  }
});

// ======================================================
// UPDATE MENU ITEM
// ======================================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      item_name,
      description,
      category,
      price,
      status,
      image_url,
    } = req.body;

    // --------------------------------------------------
    // GET EXISTING ITEM
    // --------------------------------------------------

    const existingResult = await pool.query(
      `
      SELECT *
      FROM menu_items
      WHERE id = $1
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    const existingItem = existingResult.rows[0];

    // --------------------------------------------------
    // KEEP OLD VALUES WHEN NOT PROVIDED
    // --------------------------------------------------

    const updatedItemName =
      item_name !== undefined
        ? String(item_name).trim()
        : existingItem.item_name;

    const updatedDescription =
      description !== undefined
        ? (
            description &&
            String(description).trim()
              ? String(description).trim()
              : null
          )
        : existingItem.description;

    const updatedCategory =
      category !== undefined
        ? String(category).trim()
        : existingItem.category;

    const updatedPrice =
      price !== undefined
        ? Number(price)
        : Number(existingItem.price);

    const updatedStatus =
      status !== undefined
        ? status
        : existingItem.status;

    // --------------------------------------------------
    // IMAGE
    // --------------------------------------------------

    let updatedImageUrl;

    if (image_url === undefined) {
      updatedImageUrl = existingItem.image_url;
    } else if (
      image_url === null ||
      String(image_url).trim() === ""
    ) {
      updatedImageUrl = null;
    } else {
      updatedImageUrl = String(image_url).trim();
    }

    // --------------------------------------------------
    // VALIDATION
    // --------------------------------------------------

    if (!updatedItemName) {
      return res.status(400).json({
        success: false,
        message: "Item name is required.",
      });
    }

    if (!updatedCategory) {
      return res.status(400).json({
        success: false,
        message: "Category is required.",
      });
    }

    if (
      !Number.isFinite(updatedPrice) ||
      updatedPrice < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid price is required.",
      });
    }

    const allowedStatuses = [
      "available",
      "unavailable",
    ];

    if (!allowedStatuses.includes(updatedStatus)) {
      return res.status(400).json({
        success: false,
        message: "Invalid menu item status.",
      });
    }

    // --------------------------------------------------
    // UPDATE
    // --------------------------------------------------

    const result = await pool.query(
      `
      UPDATE menu_items
      SET
        item_name = $1,
        description = $2,
        category = $3,
        price = $4,
        status = $5,
        image_url = $6,
        updated_at = NOW()
      WHERE id = $7
      RETURNING *
      `,
      [
        updatedItemName,
        updatedDescription,
        updatedCategory,
        updatedPrice,
        updatedStatus,
        updatedImageUrl,
        id,
      ]
    );

    res.json({
      success: true,
      message: "Menu item updated successfully.",
      menuItem: result.rows[0],
    });
  } catch (error) {
    console.error("Update menu item error:", error);

    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A menu item with this information already exists.",
        error: error.detail,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to update menu item.",
      error: error.message,
    });
  }
});

// ======================================================
// SAVE / REPLACE RECIPE
// ======================================================

router.put("/:id/recipe", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;
    const { recipeItems } = req.body;

    // --------------------------------------------------
    // VALIDATE MENU ITEM
    // --------------------------------------------------

    const menuResult = await client.query(
      `
      SELECT id
      FROM menu_items
      WHERE id = $1
      `,
      [id]
    );

    if (menuResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    // --------------------------------------------------
    // VALIDATE RECIPE ARRAY
    // --------------------------------------------------

    if (!Array.isArray(recipeItems)) {
      return res.status(400).json({
        success: false,
        message: "recipeItems must be an array.",
      });
    }

    // --------------------------------------------------
    // VALIDATE EACH INGREDIENT
    // --------------------------------------------------

    for (const recipe of recipeItems) {
      const ingredientId = Number(recipe.ingredient_id);
      const quantity = Number(recipe.quantity_required);

      if (
        !Number.isInteger(ingredientId) ||
        ingredientId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid ingredient ID.",
        });
      }

      if (
        !Number.isFinite(quantity) ||
        quantity <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Recipe quantity must be greater than 0.",
        });
      }

      const ingredientResult = await client.query(
        `
        SELECT id
        FROM ingredients
        WHERE id = $1
        `,
        [ingredientId]
      );

      if (ingredientResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: `Ingredient ${ingredientId} does not exist.`,
        });
      }
    }

    // --------------------------------------------------
    // TRANSACTION
    // --------------------------------------------------

    await client.query("BEGIN");

    // Delete old recipe
    await client.query(
      `
      DELETE FROM recipes
      WHERE menu_item_id = $1
      `,
      [id]
    );

    // Insert new recipe
    for (const recipe of recipeItems) {
      await client.query(
        `
        INSERT INTO recipes (
          menu_item_id,
          ingredient_id,
          quantity_required
        )
        VALUES ($1, $2, $3)
        `,
        [
          Number(id),
          Number(recipe.ingredient_id),
          Number(recipe.quantity_required),
        ]
      );
    }

    await client.query("COMMIT");

    // --------------------------------------------------
    // RETURN SAVED RECIPE
    // --------------------------------------------------

    const savedRecipe = await pool.query(
      `
      SELECT
        r.id,
        r.menu_item_id,
        r.ingredient_id,
        r.quantity_required,
        i.ingredient_name,
        i.unit
      FROM recipes r
      LEFT JOIN ingredients i
        ON i.id = r.ingredient_id
      WHERE r.menu_item_id = $1
      ORDER BY r.id ASC
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Recipe saved successfully.",
      recipeItems: savedRecipe.rows,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Save recipe error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to save recipe.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

// ======================================================
// DELETE MENU ITEM
// ======================================================

router.delete("/:id", async (req, res) => {
  const client = await pool.connect();

  try {
    const { id } = req.params;

    // --------------------------------------------------
    // CHECK ITEM
    // --------------------------------------------------

    const existingResult = await client.query(
      `
      SELECT *
      FROM menu_items
      WHERE id = $1
      `,
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    // --------------------------------------------------
    // TRANSACTION
    // --------------------------------------------------

    await client.query("BEGIN");

    // Delete recipes first
    await client.query(
      `
      DELETE FROM recipes
      WHERE menu_item_id = $1
      `,
      [id]
    );

    // Delete menu item
    const result = await client.query(
      `
      DELETE FROM menu_items
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Menu item and recipe deleted successfully.",
      deletedItem: result.rows[0],
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Delete menu item error:", error);

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message:
          "This menu item cannot be deleted because it is already being used in another record.",
        error: error.detail,
      });
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete menu item.",
      error: error.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;