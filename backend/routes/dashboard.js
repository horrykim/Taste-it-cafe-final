const express = require("express");
const router = express.Router();

const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");

// ======================================================
// GET DASHBOARD SUMMARY
// ======================================================

router.get("/summary", authenticateToken, async (req, res) => {
  try {
    // ==================================================
    // GET LOGGED-IN USER
    // ==================================================

    const userResult = await pool.query(
      `
      SELECT
        id,
        branch_id,
        full_name,
        email,
        role
      FROM users
      WHERE id = $1
      `,
      [req.user.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    const loggedInUser = userResult.rows[0];

    // ==================================================
    // DETERMINE BRANCH
    // ==================================================

    let branchId;

    // OWNER
    // Owner can choose any branch
    if (loggedInUser.role === "owner") {
      branchId = Number(req.query.branch_id);

      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: "Branch ID is required for owner dashboard.",
        });
      }
    }

    // CASHIER
    // Cashier is locked to assigned branch
    else if (loggedInUser.role === "cashier") {
      branchId = Number(loggedInUser.branch_id);

      if (!branchId) {
        return res.status(400).json({
          success: false,
          message: "Cashier account has no assigned branch.",
        });
      }
    }

    // UNKNOWN ROLE
    else {
      return res.status(403).json({
        success: false,
        message: "Unauthorized role.",
      });
    }

    console.log("=================================");
    console.log("DASHBOARD REQUEST");
    console.log("User:", loggedInUser.email);
    console.log("Role:", loggedInUser.role);
    console.log("Branch ID:", branchId);
    console.log("=================================");

    // ==================================================
    // BRANCH INFORMATION
    // ==================================================

    const branchResult = await pool.query(
      `
      SELECT
        id,
        branch_name,
        location
      FROM branches
      WHERE id = $1
      `,
      [branchId]
    );

    if (branchResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Branch not found.",
      });
    }

    const branch = branchResult.rows[0];

    // ==================================================
    // TODAY'S SALES
    // ==================================================

    const salesResult = await pool.query(
      `
      SELECT
        COALESCE(SUM(total_amount), 0) AS today_sales,
        COUNT(*) AS today_orders,
        COALESCE(AVG(total_amount), 0) AS average_order_value
      FROM sales
      WHERE branch_id = $1
        AND (sale_date AT TIME ZONE 'Asia/Manila')::date =
            (NOW() AT TIME ZONE 'Asia/Manila')::date
      `,
      [branchId]
    );

    // ==================================================
    // MENU STATISTICS
    // ==================================================
    // IMPORTANT:
    // menu_items currently DOES NOT have branch_id.
    // Therefore we do NOT filter by branch.
    // ==================================================

    const menuResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total_menu_items,
        COUNT(*) FILTER (
          WHERE status = 'available'
        ) AS available_menu_items,
        COUNT(*) FILTER (
          WHERE status = 'unavailable'
        ) AS unavailable_menu_items
      FROM menu_items
      `
    );

    // ==================================================
    // INVENTORY STATISTICS
    // ==================================================

    const inventoryResult = await pool.query(
      `
      SELECT
        COUNT(*) AS total_inventory_items,
        COUNT(*) FILTER (
          WHERE quantity <= low_stock_level
        ) AS low_stock_items,
        COUNT(*) FILTER (
          WHERE quantity <= 0
        ) AS out_of_stock_items
      FROM inventory
      WHERE branch_id = $1
      `,
      [branchId]
    );

    // ==================================================
    // RECENT SALES
    // ==================================================

    const recentSalesResult = await pool.query(
      `
      SELECT
        id,
        transaction_number,
        total_amount,
        sale_date
      FROM sales
      WHERE branch_id = $1
      ORDER BY sale_date DESC
      LIMIT 5
      `,
      [branchId]
    );

    // ==================================================
    // LOW STOCK INGREDIENTS
    // ==================================================

    const lowStockResult = await pool.query(
      `
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
      WHERE i.branch_id = $1
        AND i.quantity <= i.low_stock_level
      ORDER BY i.quantity ASC
      LIMIT 10
      `,
      [branchId]
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    res.json({
      success: true,

      user: {
        id: loggedInUser.id,
        full_name: loggedInUser.full_name,
        email: loggedInUser.email,
        role: loggedInUser.role,
      },

      branch,

      metrics: {
        todaySales: Number(
          salesResult.rows[0].today_sales
        ),

        todayOrders: Number(
          salesResult.rows[0].today_orders
        ),

        averageOrderValue: Number(
          salesResult.rows[0].average_order_value
        ),

        totalMenuItems: Number(
          menuResult.rows[0].total_menu_items
        ),

        availableMenuItems: Number(
          menuResult.rows[0].available_menu_items
        ),

        unavailableMenuItems: Number(
          menuResult.rows[0].unavailable_menu_items
        ),

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
    console.error("Dashboard summary error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to load dashboard data.",
    });
  }
});

module.exports = router;