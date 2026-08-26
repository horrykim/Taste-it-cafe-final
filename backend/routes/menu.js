
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

    // --------------------------------------------------
    // IMAGE
    // Empty image becomes NULL
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
        description && String(description).trim()
          ? String(description).trim()
          : null,
        String(category).trim(),
        Number(price),
        status || "available",
        cleanImageUrl,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Menu item added successfully.",
      menuItem: result.rows[0],
    });

  } catch (error) {
    console.error("Create menu item error:", error);

    // Duplicate / database constraint
    if (error.code === "23505") {
      return res.status(409).json({
        success: false,
        message: "A menu item with this information already exists.",
        error: error.detail,
      });
    }

    // Foreign key error
    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message: "Invalid related record.",
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
    // IMAGE HANDLING
    //
    // If image_url is NOT included:
    //     keep old image
    //
    // If image_url is empty:
    //     set image to NULL
    //
    // If image_url has a value:
    //     update image
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

    if (error.code === "23503") {
      return res.status(409).json({
        success: false,
        message: "Invalid related record.",
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
// DELETE MENU ITEM
// ======================================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // --------------------------------------------------
    // CHECK ITEM
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

    // --------------------------------------------------
    // DELETE
    // --------------------------------------------------

    const result = await pool.query(
      `
      DELETE FROM menu_items
      WHERE id = $1
      RETURNING *
      `,
      [id]
    );

    res.json({
      success: true,
      message: "Menu item deleted successfully.",
      deletedItem: result.rows[0],
    });

  } catch (error) {
    console.error("Delete menu item error:", error);

    // Foreign key violation
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
  }
});

module.exports = router;

