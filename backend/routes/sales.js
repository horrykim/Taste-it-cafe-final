const express = require("express");
const pool = require("../config/database");
const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// GET ALL SALES
// GET /api/sales
//
// Used by:
// - Reports
// - Dashboard
// - Sales history
//
// Supports:
// ?branch_id=1
// ?start_date=2026-08-01
// ?end_date=2026-08-23
// ======================================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const {
      branch_id,
      start_date,
      end_date,
    } = req.query;

    let query = `
      SELECT
        s.id,
        s.transaction_number,
        s.branch_id,
        b.branch_name,
        s.cashier_id,
        u.full_name AS cashier_name,
        s.total_amount,
        s.sale_date
      FROM sales s

      INNER JOIN branches b
        ON s.branch_id = b.id

      INNER JOIN users u
        ON s.cashier_id = u.id

      WHERE 1 = 1
    `;

    const values = [];
    let parameterIndex = 1;

    // ==================================================
    // BRANCH FILTER
    // ==================================================

    if (branch_id && branch_id !== "all") {
      query += ` AND s.branch_id = $${parameterIndex}`;
      values.push(branch_id);
      parameterIndex++;
    }

    // ==================================================
    // START DATE FILTER
    // ==================================================

    if (start_date) {
      query += ` AND s.sale_date >= $${parameterIndex}`;
      values.push(start_date);
      parameterIndex++;
    }

    // ==================================================
    // END DATE FILTER
    // ==================================================

    if (end_date) {
      query += ` AND s.sale_date < ($${parameterIndex}::date + INTERVAL '1 day')`;
      values.push(end_date);
      parameterIndex++;
    }

    // ==================================================
    // ORDER
    // ==================================================

    query += `
      ORDER BY s.sale_date DESC, s.id DESC
    `;

    const result = await pool.query(query, values);

    // ==================================================
    // CALCULATE TOTAL
    // ==================================================

    const totalSales = result.rows.reduce((total, sale) => {
      return total + Number(sale.total_amount || 0);
    }, 0);

    res.json({
      success: true,

      count: result.rows.length,

      total_sales: totalSales,

      sales: result.rows,
    });
  } catch (error) {
    console.error("Get sales error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get sales.",
      error: error.message,
    });
  }
});

// ======================================================
// GET SALE BY ID
// GET /api/sales/:id
// ======================================================

router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // ==================================================
    // GET SALE
    // ==================================================

    const saleResult = await pool.query(
      `
      SELECT
        s.id,
        s.transaction_number,
        s.branch_id,
        b.branch_name,
        s.cashier_id,
        u.full_name AS cashier_name,
        s.total_amount,
        s.sale_date

      FROM sales s

      INNER JOIN branches b
        ON s.branch_id = b.id

      INNER JOIN users u
        ON s.cashier_id = u.id

      WHERE s.id = $1
      `,
      [id]
    );

    if (saleResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Sale not found.",
      });
    }

    // ==================================================
    // GET SALE ITEMS
    // ==================================================

    const itemsResult = await pool.query(
      `
      SELECT
        si.id,
        si.sale_id,
        si.menu_item_id,
        m.item_name,
        si.quantity,
        si.unit_price,
        si.subtotal

      FROM sale_items si

      INNER JOIN menu_items m
        ON si.menu_item_id = m.id

      WHERE si.sale_id = $1

      ORDER BY si.id ASC
      `,
      [id]
    );

    // ==================================================
    // RESPONSE
    // ==================================================

    res.json({
      success: true,

      sale: saleResult.rows[0],

      items: itemsResult.rows,
    });
  } catch (error) {
    console.error("Get sale error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get sale.",
      error: error.message,
    });
  }
});

// ======================================================
// CREATE SALE
// POST /api/sales
//
// FLOW:
//
// 1. Validate sale items
// 2. Get cashier and branch from JWT
// 3. Start database transaction
// 4. Validate menu items
// 5. Calculate sale total
// 6. Get recipes
// 7. Calculate ingredient usage
// 8. Check branch inventory
// 9. Deduct ingredients
// 10. Create sale
// 11. Create sale items
// 12. Commit transaction
// ======================================================

router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  let transactionStarted = false;

  try {
    const { items } = req.body;

    // ==================================================
    // VALIDATION
    // ==================================================

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one sale item is required.",
      });
    }

    // ==================================================
    // USER INFORMATION FROM JWT
    // ==================================================

    const cashierId = req.user.userId;
    const branchId = req.user.branchId;

    if (!cashierId || !branchId) {
      return res.status(401).json({
        success: false,
        message:
          "User branch or cashier information is missing.",
      });
    }

    // ==================================================
    // START DATABASE TRANSACTION
    // ==================================================

    await client.query("BEGIN");

    transactionStarted = true;

    let totalAmount = 0;

    const saleItems = [];

    // Stores total ingredient usage
    const ingredientUsage = new Map();

    // ==================================================
    // VALIDATE MENU ITEMS
    // AND CALCULATE TOTAL
    // ==================================================

    for (const item of items) {
      const { menu_item_id, quantity } = item;

      // ==================================================
      // CHECK MENU ITEM ID
      // ==================================================

      if (!menu_item_id) {
        const error = new Error(
          "Menu item ID is required."
        );

        error.statusCode = 400;

        throw error;
      }

      // ==================================================
      // CHECK QUANTITY
      // ==================================================

      if (
        quantity === undefined ||
        quantity === null ||
        !Number.isInteger(Number(quantity)) ||
        Number(quantity) <= 0
      ) {
        const error = new Error(
          "Quantity must be a positive whole number."
        );

        error.statusCode = 400;

        throw error;
      }

      const itemQuantity = Number(quantity);

      // ==================================================
      // GET MENU ITEM
      // ==================================================

      const menuResult = await client.query(
        `
        SELECT
          id,
          item_name,
          price,
          status

        FROM menu_items

        WHERE id = $1

        FOR UPDATE
        `,
        [menu_item_id]
      );

      if (menuResult.rows.length === 0) {
        const error = new Error(
          `Menu item ${menu_item_id} not found.`
        );

        error.statusCode = 404;

        throw error;
      }

      const menuItem = menuResult.rows[0];

      // ==================================================
      // CHECK MENU ITEM AVAILABILITY
      // ==================================================

      if (menuItem.status !== "available") {
        const error = new Error(
          `${menuItem.item_name} is not available.`
        );

        error.statusCode = 400;

        throw error;
      }

      // ==================================================
      // CALCULATE SUBTOTAL
      // ==================================================

      const unitPrice = Number(menuItem.price);

      const subtotal = itemQuantity * unitPrice;

      totalAmount += subtotal;

      saleItems.push({
        menu_item_id: menuItem.id,
        item_name: menuItem.item_name,
        quantity: itemQuantity,
        unit_price: unitPrice,
        subtotal: subtotal,
      });

      // ==================================================
      // GET RECIPE
      // ==================================================

      const recipeResult = await client.query(
        `
        SELECT
          r.ingredient_id,
          r.quantity_required,
          i.ingredient_name,
          i.unit

        FROM recipes r

        INNER JOIN ingredients i
          ON r.ingredient_id = i.id

        WHERE r.menu_item_id = $1

        ORDER BY r.id ASC
        `,
        [menuItem.id]
      );

      if (recipeResult.rows.length === 0) {
        const error = new Error(
          `${menuItem.item_name} does not have a recipe. Please add its recipe first.`
        );

        error.statusCode = 400;

        throw error;
      }

      // ==================================================
      // CALCULATE INGREDIENT USAGE
      // ==================================================

      for (const recipe of recipeResult.rows) {
        const quantityRequired = Number(
          recipe.quantity_required
        );

        if (
          !Number.isFinite(quantityRequired) ||
          quantityRequired <= 0
        ) {
          const error = new Error(
            `Invalid recipe quantity for ${recipe.ingredient_name}.`
          );

          error.statusCode = 400;

          throw error;
        }

        const totalRequired =
          quantityRequired * itemQuantity;

        if (
          ingredientUsage.has(
            recipe.ingredient_id
          )
        ) {
          const existing =
            ingredientUsage.get(
              recipe.ingredient_id
            );

          existing.quantity_required +=
            totalRequired;
        } else {
          ingredientUsage.set(
            recipe.ingredient_id,
            {
              ingredient_id:
                recipe.ingredient_id,

              ingredient_name:
                recipe.ingredient_name,

              unit: recipe.unit,

              quantity_required:
                totalRequired,
            }
          );
        }
      }
    }

    // ==================================================
    // CHECK AND DEDUCT INVENTORY
    // ==================================================

    const inventoryDeductions = [];

    for (const ingredient of ingredientUsage.values()) {
      // ==================================================
      // GET INVENTORY
      // ==================================================

      const inventoryResult = await client.query(
        `
        SELECT
          id,
          branch_id,
          ingredient_id,
          quantity,
          low_stock_level

        FROM inventory

        WHERE branch_id = $1
          AND ingredient_id = $2

        FOR UPDATE
        `,
        [
          branchId,
          ingredient.ingredient_id,
        ]
      );

      if (inventoryResult.rows.length === 0) {
        const error = new Error(
          `No inventory record found for ${ingredient.ingredient_name} in this branch.`
        );

        error.statusCode = 400;

        throw error;
      }

      const inventory =
        inventoryResult.rows[0];

      const currentQuantity =
        Number(inventory.quantity);

      const quantityToDeduct =
        Number(
          ingredient.quantity_required
        );

      // ==================================================
      // CHECK ENOUGH STOCK
      // ==================================================

      if (
        currentQuantity <
        quantityToDeduct
      ) {
        const error = new Error(
          `Insufficient ${ingredient.ingredient_name}. ` +
            `Available: ${currentQuantity} ${ingredient.unit}, ` +
            `Required: ${quantityToDeduct} ${ingredient.unit}.`
        );

        error.statusCode = 400;

        throw error;
      }

      // ==================================================
      // CALCULATE NEW INVENTORY
      // ==================================================

      const newQuantity =
        currentQuantity -
        quantityToDeduct;

      // ==================================================
      // UPDATE INVENTORY
      // ==================================================

      await client.query(
        `
        UPDATE inventory

        SET quantity = $1

        WHERE id = $2
        `,
        [
          newQuantity,
          inventory.id,
        ]
      );

      // ==================================================
      // SAVE DEDUCTION INFORMATION
      // ==================================================

      inventoryDeductions.push({
        inventory_id: inventory.id,

        ingredient_id:
          ingredient.ingredient_id,

        ingredient_name:
          ingredient.ingredient_name,

        unit: ingredient.unit,

        quantity_deducted:
          quantityToDeduct,

        remaining_quantity:
          newQuantity,

        low_stock_level:
          Number(
            inventory.low_stock_level
          ),
      });
    }

    // ==================================================
    // GENERATE TRANSACTION NUMBER
    // ==================================================

    const transactionNumber =
      `TIC-${Date.now()}-${Math.floor(
        Math.random() * 1000
      )
        .toString()
        .padStart(3, "0")}`;

    // ==================================================
    // INSERT SALE
    // ==================================================

    const saleResult = await client.query(
      `
      INSERT INTO sales (
        transaction_number,
        branch_id,
        cashier_id,
        total_amount
      )

      VALUES ($1, $2, $3, $4)

      RETURNING *
      `,
      [
        transactionNumber,
        branchId,
        cashierId,
        totalAmount,
      ]
    );

    const sale = saleResult.rows[0];

    // ==================================================
    // INSERT SALE ITEMS
    // ==================================================

    for (const item of saleItems) {
      await client.query(
        `
        INSERT INTO sale_items (
          sale_id,
          menu_item_id,
          quantity,
          unit_price,
          subtotal
        )

        VALUES ($1, $2, $3, $4, $5)
        `,
        [
          sale.id,
          item.menu_item_id,
          item.quantity,
          item.unit_price,
          item.subtotal,
        ]
      );
    }

    // ==================================================
    // COMMIT
    // ==================================================

    await client.query("COMMIT");

    transactionStarted = false;

    // ==================================================
    // SUCCESS RESPONSE
    // ==================================================

    res.status(201).json({
      success: true,

      message:
        "Sale recorded and inventory updated successfully.",

      sale: {
        id: sale.id,

        transaction_number:
          sale.transaction_number,

        branch_id:
          sale.branch_id,

        cashier_id:
          sale.cashier_id,

        total_amount:
          sale.total_amount,

        sale_date:
          sale.sale_date,
      },

      items: saleItems,

      inventory_deductions:
        inventoryDeductions,
    });
  } catch (error) {
    // ==================================================
    // ROLLBACK
    // ==================================================

    if (transactionStarted) {
      await client.query("ROLLBACK");
    }

    console.error(
      "Create sale error:",
      error
    );

    const statusCode =
      error.statusCode || 500;

    res.status(statusCode).json({
      success: false,

      message:
        statusCode === 500
          ? "Failed to create sale."
          : error.message,

      error: error.message,
    });
  } finally {
    client.release();
  }
});

module.exports = router;
