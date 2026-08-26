const express = require("express");
const router = express.Router();

const pool = require("../config/database");

// ======================================================
// GET DASHBOARD SUMMARY
// ======================================================

router.get("/summary", async (req, res) => {
  try {

    // ==================================================
    // TODAY'S SALES
    // ==================================================

    const salesResult = await pool.query(`
      SELECT
        COALESCE(SUM(total_amount), 0) AS today_sales,
        COUNT(*) AS today_orders,
        COALESCE(AVG(total_amount), 0) AS average_order_value
      FROM sales
      WHERE
        (sale_date AT TIME ZONE 'Asia/Manila')::date =
        (NOW() AT TIME ZONE 'Asia/Manila')::date
    `);

    // ==================================================
    // MENU STATISTICS
    // ==================================================

    const menuResult = await pool.query(`
      SELECT
        COUNT(*) AS total_menu_items,

        COUNT(*) FILTER (
          WHERE status = 'available'
        ) AS available_menu_items,

        COUNT(*) FILTER (
          WHERE status = 'unavailable'
        ) AS unavailable_menu_items

      FROM menu_items
    `);

    // ==================================================
    // INVENTORY STATISTICS
    // ==================================================

    const inventoryResult = await pool.query(`
      SELECT
        COUNT(*) AS total_inventory_items,

        COUNT(*) FILTER (
          WHERE quantity <= low_stock_level
        ) AS low_stock_items,

        COUNT(*) FILTER (
          WHERE quantity <= 0
        ) AS out_of_stock_items

      FROM inventory
    `);

    // ==================================================
    // RECENT SALES
    // ==================================================

    const recentSalesResult = await pool.query(`
      SELECT
        id,
        transaction_number,
        total_amount,
        sale_date
      FROM sales
      ORDER BY sale_date DESC
      LIMIT 5
    `);

    // ==================================================
    // LOW STOCK INGREDIENTS
    // ==================================================

    const lowStockResult = await pool.query(`
      SELECT
        i.id,
        i.quantity,
        i.low_stock_level,
        ing.ingredient_name,
        ing.unit,
        b.branch_name

      FROM inventory i

      LEFT JOIN ingredients ing
        ON i.ingredient_id = ing.id

      LEFT JOIN branches b
        ON i.branch_id = b.id

      WHERE i.quantity <= i.low_stock_level

      ORDER BY i.quantity ASC
      LIMIT 10
    `);

    // ==================================================
    // RESPONSE
    // ==================================================

    res.json({
      success: true,

      metrics: {

        // SALES
        todaySales: Number(
          salesResult.rows[0].today_sales
        ),

        todayOrders: Number(
          salesResult.rows[0].today_orders
        ),

        averageOrderValue: Number(
          salesResult.rows[0].average_order_value
        ),

        // MENU
        totalMenuItems: Number(
          menuResult.rows[0].total_menu_items
        ),

        availableMenuItems: Number(
          menuResult.rows[0].available_menu_items
        ),

        unavailableMenuItems: Number(
          menuResult.rows[0].unavailable_menu_items
        ),

        // INVENTORY
        totalInventoryItems: Number(
          inventoryResult.rows[0].total_inventory_items
        ),

        lowStockItems: Number(
          inventoryResult.rows[0].low_stock_items
        ),

        outOfStockItems: Number(
          inventoryResult.rows[0].out_of_stock_items
        ),
      },

      recentSales: recentSalesResult.rows,

      lowStock: lowStockResult.rows,
    });

  } catch (error) {

    console.error(
      "Dashboard summary error:",
      error
    );

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data.",
    });
  }
});

module.exports = router;
