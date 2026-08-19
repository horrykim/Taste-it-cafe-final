const express = require("express");
const router = express.Router();

const pool = require("../config/database");

// ==========================================
// GET ALL MENU ITEMS
// ==========================================

router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM menu_items ORDER BY id DESC"
    );

    res.json({
      success: true,
      menuItems: result.rows,
    });
  } catch (error) {
    console.error("Error getting menu items:", error);

    res.status(500).json({
      success: false,
      message: "Server error while getting menu items.",
    });
  }
});

// ==========================================
// ADD MENU ITEM
// ==========================================

router.post("/", async (req, res) => {
  try {
    const {
      item_name,
      description,
      price,
      status,
    } = req.body;

    if (!item_name || price === undefined || !status) {
      return res.status(400).json({
        success: false,
        message: "Item name, price, and status are required.",
      });
    }

    const result = await pool.query(
      `INSERT INTO menu_items
       (item_name, description, price, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        item_name,
        description || null,
        price,
        status,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Menu item added successfully.",
      menuItem: result.rows[0],
    });
  } catch (error) {
    console.error("Error adding menu item:", error);

    res.status(500).json({
      success: false,
      message: "Server error while adding menu item.",
    });
  }
});

// ==========================================
// UPDATE MENU ITEM
// ==========================================

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const {
      item_name,
      description,
      price,
      status,
    } = req.body;

    if (!item_name || price === undefined || !status) {
      return res.status(400).json({
        success: false,
        message: "Item name, price, and status are required.",
      });
    }

    const result = await pool.query(
      `UPDATE menu_items
       SET
         item_name = $1,
         description = $2,
         price = $3,
         status = $4
       WHERE id = $5
       RETURNING *`,
      [
        item_name,
        description || null,
        price,
        status,
        id,
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found.",
      });
    }

    res.json({
      success: true,
      message: "Menu item updated successfully.",
      menuItem: result.rows[0],
    });
  } catch (error) {
    console.error("Error updating menu item:", error);

    res.status(500).json({
      success: false,
      message: "Server error while updating menu item.",
    });
  }
});

// ==========================================
// DELETE MENU ITEM
// ==========================================

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `DELETE FROM menu_items
       WHERE id = $1
       RETURNING *`,
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
      message: "Menu item deleted successfully.",
    });
  } catch (error) {
    console.error("Error deleting menu item:", error);

    res.status(500).json({
      success: false,
      message: "Server error while deleting menu item.",
    });
  }
});

module.exports = router;