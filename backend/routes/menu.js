const express = require("express");
const router = express.Router();

const pool = require("../config/database");

// ======================================================
// NOTES
//
// This replaces the previous routes/menu.js, which was written before the
// menu schema migration. It adds:
//   - branch scoping (menu_items.branch_id)
//   - category_id instead of the free-text category column
//   - is_active / is_available instead of the single status column
//   - recipe read + write (recipes + recipe_ingredients)
//   - soft delete, so historical sale_items keep resolving
//
// The legacy columns menu_items.category and menu_items.status are still
// written on every insert/update, so any older code that still reads them
// keeps working. They can be dropped once nothing reads them.
// ======================================================

const jwt = require("jsonwebtoken");

// ------------------------------------------------------
// ACTOR RESOLUTION
//
// Verifies the same JWT that routes/auth.js issues:
//     { userId, branchId, role }
//
// The frontend AuthContext still logs in through mockAuthService, so no token
// exists yet. Until that is migrated, an unauthenticated request falls back to
// the x-user-role header so Menu Management keeps working in development.
//
// >>> Set REQUIRE_AUTH = true once AuthContext calls POST /api/auth/login and
// >>> stores the token. A header alone is NOT security.
// ------------------------------------------------------

const REQUIRE_AUTH = false;

function resolveActor(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (token) {
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      return {
        userId: payload.userId,
        branchId: payload.branchId,
        role: payload.role,
        verified: true,
      };
    } catch {
      return null;
    }
  }

  if (REQUIRE_AUTH) return null;

  const role = req.headers["x-user-role"];
  return role ? { userId: null, branchId: null, role, verified: false } : null;
}

function requireRole(req, res, allowed) {
  const actor = resolveActor(req);

  if (!actor) {
    res.status(401).json({
      success: false,
      message: "You are not signed in.",
    });
    return null;
  }

  if (!allowed.includes(actor.role)) {
    res.status(403).json({
      success: false,
      message: "You do not have permission for this menu action.",
    });
    return null;
  }

  return actor;
}

// node-postgres returns bigint as a string. Normalise so the frontend can
// compare ids without surprises.
function toNumber(value) {
  return value === null || value === undefined ? null : Number(value);
}

function mapMenuItem(row) {
  return {
    id: toNumber(row.id),
    branch_id: toNumber(row.branch_id),
    category_id: row.category_id,
    category_name: row.category_name,
    recipe_id: toNumber(row.recipe_id),
    item_name: row.item_name,
    description: row.description,
    price: Number(row.price),
    image_url: row.image_url,
    is_active: row.is_active,
    is_available: row.is_available,
    deleted_at: row.deleted_at,
    created_at: row.created_at,
    updated_at: row.updated_at,
    recipe: (row.recipe || []).map((entry) => ({
      ingredient_id: toNumber(entry.ingredient_id),
      quantity_required: Number(entry.quantity_required),
      unit: entry.unit,
    })),
  };
}

function handleDbError(res, error, message) {
  console.error(message, error);

  if (error.code === "23505") {
    return res.status(409).json({
      success: false,
      message: "A record with this information already exists.",
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

  return res.status(500).json({
    success: false,
    message,
    error: error.message,
  });
}

// ======================================================
// CATEGORIES
// IMPORTANT: these must stay BEFORE /:id
// ======================================================

// GET /api/menu/categories
router.get("/categories", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        category_id,
        name,
        description,
        display_order,
        color,
        is_active,
        created_at,
        updated_at
      FROM menu_categories
      WHERE is_active = TRUE
      ORDER BY display_order ASC, name ASC
    `);

    res.json({
      success: true,
      categories: result.rows,
    });

  } catch (error) {
    handleDbError(res, error, "Failed to get menu categories.");
  }
});

// POST /api/menu/categories
router.post("/categories", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER"]);
  if (!actor) return;

  try {
    const { name, description, display_order, color } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required.",
      });
    }

    const result = await pool.query(
      `
      INSERT INTO menu_categories (
        category_id, name, description, display_order, color,
        is_active, created_at, updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, TRUE, NOW(), NOW())
      RETURNING *
      `,
      [
        String(name).trim(),
        description && String(description).trim() ? String(description).trim() : null,
        Number.isFinite(Number(display_order)) ? Number(display_order) : 0,
        color || null,
      ]
    );

    res.status(201).json({
      success: true,
      message: "Category added successfully.",
      category: result.rows[0],
    });

  } catch (error) {
    handleDbError(res, error, "Failed to add category.");
  }
});

// PUT /api/menu/categories/:categoryId
router.put("/categories/:categoryId", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER"]);
  if (!actor) return;

  try {
    const { categoryId } = req.params;
    const { name, description, display_order, color, is_active } = req.body;

    const existing = await pool.query(
      `SELECT * FROM menu_categories WHERE category_id = $1`,
      [categoryId]
    );

    if (existing.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    const current = existing.rows[0];

    const result = await pool.query(
      `
      UPDATE menu_categories
      SET
        name          = $1,
        description   = $2,
        display_order = $3,
        color         = $4,
        is_active     = $5,
        updated_at    = NOW()
      WHERE category_id = $6
      RETURNING *
      `,
      [
        name !== undefined ? String(name).trim() : current.name,
        description !== undefined
          ? (description && String(description).trim() ? String(description).trim() : null)
          : current.description,
        display_order !== undefined ? Number(display_order) : current.display_order,
        color !== undefined ? (color || null) : current.color,
        is_active !== undefined ? Boolean(is_active) : current.is_active,
        categoryId,
      ]
    );

    res.json({
      success: true,
      message: "Category updated successfully.",
      category: result.rows[0],
    });

  } catch (error) {
    handleDbError(res, error, "Failed to update category.");
  }
});

// DELETE /api/menu/categories/:categoryId?reassign_to=<uuid>
//
// Spec: deleting a category must NOT blindly delete its menu items.
// With reassign_to  -> move the items, then delete the category.
// Without           -> set the items unavailable and deactivate the category.
router.delete("/categories/:categoryId", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER"]);
  if (!actor) return;

  const client = await pool.connect();
  let beganTransaction = false;

  try {
    const { categoryId } = req.params;
    const reassignTo = req.query.reassign_to || null;

    beganTransaction = true;
    await client.query("BEGIN");

    const existing = await client.query(
      `SELECT * FROM menu_categories WHERE category_id = $1`,
      [categoryId]
    );

    if (existing.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    if (reassignTo) {
      const target = await client.query(
        `SELECT name FROM menu_categories WHERE category_id = $1`,
        [reassignTo]
      );

      if (target.rows.length === 0) {
        await client.query("ROLLBACK");
        return res.status(400).json({
          success: false,
          message: "The category to move items into was not found.",
        });
      }

      await client.query(
        `UPDATE menu_items
         SET category_id = $1, category = $2, updated_at = NOW()
         WHERE category_id = $3`,
        [reassignTo, target.rows[0].name, categoryId]
      );

      await client.query(
        `DELETE FROM menu_categories WHERE category_id = $1`,
        [categoryId]
      );

      await client.query("COMMIT");

      return res.json({
        success: true,
        message: "Category deleted and its menu items were moved.",
      });
    }

    await client.query(
      `UPDATE menu_items
       SET is_active = FALSE, status = 'unavailable', updated_at = NOW()
       WHERE category_id = $1 AND deleted_at IS NULL`,
      [categoryId]
    );

    await client.query(
      `UPDATE menu_categories
       SET is_active = FALSE, updated_at = NOW()
       WHERE category_id = $1`,
      [categoryId]
    );

    await client.query("COMMIT");

    res.json({
      success: true,
      message: "Category deleted. Its menu items were set to inactive.",
    });

  } catch (error) {
    if (beganTransaction) await client.query("ROLLBACK");
    handleDbError(res, error, "Failed to delete category.");
  } finally {
    client.release();
  }
});

// ======================================================
// MENU ITEMS
// ======================================================

const MENU_ITEM_SELECT = `
  SELECT
    m.id,
    m.branch_id,
    m.category_id,
    c.name AS category_name,
    m.recipe_id,
    m.item_name,
    m.description,
    m.price,
    m.image_url,
    m.is_active,
    m.is_available,
    m.deleted_at,
    m.created_at,
    m.updated_at,
    COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'ingredient_id',     ri.ingredient_id,
            'quantity_required', ri.quantity_required,
            'unit',              ri.unit
          )
          ORDER BY ri.id
        )
        FROM recipe_ingredients ri
        WHERE ri.recipe_id = m.recipe_id
      ),
      '[]'::json
    ) AS recipe
  FROM menu_items m
  LEFT JOIN menu_categories c
    ON c.category_id = m.category_id
`;

// GET /api/menu?branch_id=1
// branch_id is required — the menu is branch-scoped.
router.get("/", async (req, res) => {
  try {
    const { branch_id } = req.query;

    if (branch_id === undefined || branch_id === "") {
      return res.status(400).json({
        success: false,
        message: "branch_id is required.",
      });
    }

    // Staff may only read their own branch. Enforced here on the server, not
    // just in the UI.
    const actor = resolveActor(req);
    if (
      actor &&
      actor.verified &&
      actor.role === "STAFF" &&
      Number(actor.branchId) !== Number(branch_id)
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only view the menu of your assigned branch.",
      });
    }

    const result = await pool.query(
      `${MENU_ITEM_SELECT}
       WHERE m.branch_id = $1
         AND m.deleted_at IS NULL
       ORDER BY m.updated_at DESC NULLS LAST, m.id DESC`,
      [branch_id]
    );

    res.json({
      success: true,
      menuItems: result.rows.map(mapMenuItem),
    });

  } catch (error) {
    handleDbError(res, error, "Failed to get menu items.");
  }
});

// GET /api/menu/:id
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `${MENU_ITEM_SELECT} WHERE m.id = $1`,
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
      menuItem: mapMenuItem(result.rows[0]),
    });

  } catch (error) {
    handleDbError(res, error, "Failed to get menu item.");
  }
});

// Validates the recipe payload and returns cleaned rows.
function cleanRecipe(recipe) {
  const rows = (recipe || []).map((entry) => {
    const ingredientId = Number(entry.ingredient_id);
    const quantity = Number(entry.quantity_required);

    if (!Number.isFinite(ingredientId) || !Number.isFinite(quantity) || quantity <= 0) {
      const error = new Error("Recipe ingredients need a valid ingredient and a quantity greater than zero.");
      error.statusCode = 400;
      throw error;
    }

    return {
      ingredient_id: ingredientId,
      quantity_required: quantity,
      unit: entry.unit ? String(entry.unit).trim() : null,
    };
  });

  const unique = new Set(rows.map((row) => row.ingredient_id));
  if (unique.size !== rows.length) {
    const error = new Error("An ingredient can only appear once in a recipe.");
    error.statusCode = 400;
    throw error;
  }

  return rows;
}

// Replaces the recipe header and its ingredient rows for one menu item.
// Runs inside the caller's transaction.
async function saveRecipe(client, menuItemId, recipeRows) {
  const existing = await client.query(
    `SELECT id FROM recipes WHERE menu_item_id = $1`,
    [menuItemId]
  );

  if (recipeRows.length === 0) {
    if (existing.rows.length > 0) {
      await client.query(`DELETE FROM recipes WHERE id = $1`, [existing.rows[0].id]);
      await client.query(`UPDATE menu_items SET recipe_id = NULL WHERE id = $1`, [menuItemId]);
    }
    return null;
  }

  const recipeId = existing.rows.length
    ? existing.rows[0].id
    : (
        await client.query(
          `INSERT INTO recipes (menu_item_id) VALUES ($1) RETURNING id`,
          [menuItemId]
        )
      ).rows[0].id;

  await client.query(`DELETE FROM recipe_ingredients WHERE recipe_id = $1`, [recipeId]);

  for (const row of recipeRows) {
    await client.query(
      `INSERT INTO recipe_ingredients (
         recipe_id, menu_item_id, ingredient_id, quantity_required, unit
       )
       VALUES ($1, $2, $3, $4, COALESCE($5, (SELECT unit FROM ingredients WHERE id = $3)))`,
      [recipeId, menuItemId, row.ingredient_id, row.quantity_required, row.unit]
    );
  }

  await client.query(`UPDATE menu_items SET recipe_id = $1 WHERE id = $2`, [recipeId, menuItemId]);

  return recipeId;
}

// POST /api/menu
router.post("/", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER"]);
  if (!actor) return;

  const client = await pool.connect();
  let beganTransaction = false;

  try {
    const {
      branch_id,
      category_id,
      item_name,
      description,
      price,
      image_url,
      is_active,
      recipe,
    } = req.body;

    if (branch_id === undefined || branch_id === null || branch_id === "") {
      return res.status(400).json({ success: false, message: "branch_id is required." });
    }

    if (!item_name || !String(item_name).trim()) {
      return res.status(400).json({ success: false, message: "Item name is required." });
    }

    if (!category_id) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }

    if (
      price === undefined || price === null || price === "" ||
      !Number.isFinite(Number(price)) || Number(price) < 0
    ) {
      return res.status(400).json({ success: false, message: "Valid price is required." });
    }

    const recipeRows = cleanRecipe(recipe);
    const selling = is_active === undefined ? true : Boolean(is_active);

    beganTransaction = true;
    await client.query("BEGIN");

    // Keep the legacy category text column in step with category_id.
    const categoryRow = await client.query(
      `SELECT name FROM menu_categories WHERE category_id = $1`,
      [category_id]
    );

    if (categoryRow.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Category not found." });
    }

    const inserted = await client.query(
      `
      INSERT INTO menu_items (
        branch_id, category_id, category, item_name, description,
        price, image_url, is_active, is_available, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9)
      RETURNING id
      `,
      [
        branch_id,
        category_id,
        categoryRow.rows[0].name,
        String(item_name).trim(),
        description && String(description).trim() ? String(description).trim() : null,
        Number(price),
        image_url && String(image_url).trim() ? String(image_url).trim() : null,
        selling,
        selling ? "available" : "unavailable",
      ]
    );

    const menuItemId = inserted.rows[0].id;
    await saveRecipe(client, menuItemId, recipeRows);

    await client.query("COMMIT");

    const created = await pool.query(`${MENU_ITEM_SELECT} WHERE m.id = $1`, [menuItemId]);

    res.status(201).json({
      success: true,
      message: "Menu item added successfully.",
      menuItem: mapMenuItem(created.rows[0]),
    });

  } catch (error) {
    // Validation can fail before BEGIN — rolling back then throws its own error
    // and hides the real one.
    if (beganTransaction) await client.query("ROLLBACK");

    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }

    handleDbError(res, error, "Failed to add menu item.");
  } finally {
    client.release();
  }
});

// PUT /api/menu/:id
router.put("/:id", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER"]);
  if (!actor) return;

  const client = await pool.connect();
  let beganTransaction = false;

  try {
    const { id } = req.params;
    const {
      branch_id,
      category_id,
      item_name,
      description,
      price,
      image_url,
      is_active,
      recipe,
    } = req.body;


    const existingResult = await client.query(`SELECT * FROM menu_items WHERE id = $1`, [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    const existing = existingResult.rows[0];

    const nextName = item_name !== undefined ? String(item_name).trim() : existing.item_name;
    const nextCategoryId = category_id !== undefined ? category_id : existing.category_id;
    const nextBranchId = branch_id !== undefined ? branch_id : existing.branch_id;
    const nextPrice = price !== undefined ? Number(price) : Number(existing.price);
    const nextSelling =
      is_active !== undefined ? Boolean(is_active) : existing.is_active;

    const nextDescription =
      description !== undefined
        ? (description && String(description).trim() ? String(description).trim() : null)
        : existing.description;

    let nextImageUrl;
    if (image_url === undefined) {
      nextImageUrl = existing.image_url;
    } else if (image_url === null || String(image_url).trim() === "") {
      nextImageUrl = null;
    } else {
      nextImageUrl = String(image_url).trim();
    }

    if (!nextName) {
      return res.status(400).json({ success: false, message: "Item name is required." });
    }

    if (!nextCategoryId) {
      return res.status(400).json({ success: false, message: "Category is required." });
    }

    if (!Number.isFinite(nextPrice) || nextPrice < 0) {
      return res.status(400).json({ success: false, message: "Valid price is required." });
    }

    const recipeRows = recipe !== undefined ? cleanRecipe(recipe) : null;

    beganTransaction = true;
    await client.query("BEGIN");

    const categoryRow = await client.query(
      `SELECT name FROM menu_categories WHERE category_id = $1`,
      [nextCategoryId]
    );

    if (categoryRow.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ success: false, message: "Category not found." });
    }

    await client.query(
      `
      UPDATE menu_items
      SET
        branch_id    = $1,
        category_id  = $2,
        category     = $3,
        item_name    = $4,
        description  = $5,
        price        = $6,
        image_url    = $7,
        is_active    = $8,
        status       = $9,
        updated_at   = NOW()
      WHERE id = $10
      `,
      [
        nextBranchId,
        nextCategoryId,
        categoryRow.rows[0].name,
        nextName,
        nextDescription,
        nextPrice,
        nextImageUrl,
        nextSelling,
        nextSelling ? "available" : "unavailable",
        id,
      ]
    );

    // recipe omitted from the payload means "leave the recipe alone".
    if (recipeRows !== null) {
      await saveRecipe(client, id, recipeRows);
    }

    await client.query("COMMIT");

    const updated = await pool.query(`${MENU_ITEM_SELECT} WHERE m.id = $1`, [id]);

    res.json({
      success: true,
      message: "Menu item updated successfully.",
      menuItem: mapMenuItem(updated.rows[0]),
    });

  } catch (error) {
    if (beganTransaction) await client.query("ROLLBACK");

    if (error.statusCode === 400) {
      return res.status(400).json({ success: false, message: error.message });
    }

    handleDbError(res, error, "Failed to update menu item.");
  } finally {
    client.release();
  }
});

// PATCH /api/menu/:id/status
//
// is_active — does the cafe still sell this item at all?
// This is what the Active/Inactive toggle in the UI controls.
// Owner and Staff may both flip it.
router.patch("/:id/status", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER", "STAFF"]);
  if (!actor) return;

  try {
    const { id } = req.params;
    const { is_active } = req.body;

    if (is_active === undefined) {
      return res.status(400).json({ success: false, message: "is_active is required." });
    }

    const selling = Boolean(is_active);

    const result = await pool.query(
      `
      UPDATE menu_items
      SET is_active = $1, status = $2, updated_at = NOW()
      WHERE id = $3 AND deleted_at IS NULL
      RETURNING id
      `,
      [selling, selling ? "available" : "unavailable", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    res.json({
      success: true,
      message: selling
        ? "Menu item is now active."
        : "Menu item is now inactive.",
    });

  } catch (error) {
    handleDbError(res, error, "Failed to update menu item status.");
  }
});

// PATCH /api/menu/:id/availability
//
// is_available — is there stock to sell it right now?
// Kept separate from is_active on purpose. Inventory and the POS drive this;
// the Menu Management toggle does NOT.
router.patch("/:id/availability", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER", "STAFF"]);
  if (!actor) return;

  try {
    const { id } = req.params;
    const { is_available } = req.body;

    if (is_available === undefined) {
      return res.status(400).json({ success: false, message: "is_available is required." });
    }

    const result = await pool.query(
      `
      UPDATE menu_items
      SET is_available = $1, updated_at = NOW()
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING id
      `,
      [Boolean(is_available), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    res.json({
      success: true,
      message: is_available
        ? "Menu item is in stock."
        : "Menu item is out of stock.",
    });

  } catch (error) {
    handleDbError(res, error, "Failed to update menu item availability.");
  }
});

// DELETE /api/menu/:id
// Soft delete. The row stays so historical sale_items still resolve their
// menu item, which is why the old hard DELETE hit foreign-key errors.
router.delete("/:id", async (req, res) => {
  const actor = requireRole(req, res, ["OWNER"]);
  if (!actor) return;

  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      UPDATE menu_items
      SET deleted_at = NOW(), is_active = FALSE, status = 'unavailable', updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL
      RETURNING id, item_name
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Menu item not found." });
    }

    res.json({
      success: true,
      message: "Menu item deleted successfully.",
      deletedItem: result.rows[0],
    });

  } catch (error) {
    handleDbError(res, error, "Failed to delete menu item.");
  }
});

module.exports = router;