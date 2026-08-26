const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/database");

const {
  authenticateToken,
  requireOwner,
} = require("../middleware/authMiddleware");

const router = express.Router();

// ======================================================
// LOGIN
// POST /api/auth/login
// ======================================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // ------------------------------
    // CHECK REQUIRED FIELDS
    // ------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // ------------------------------
    // CHECK JWT SECRET
    // ------------------------------

    if (!process.env.JWT_SECRET) {
      console.error("JWT_SECRET is not configured.");

      return res.status(500).json({
        success: false,
        message: "Server authentication configuration error.",
      });
    }

    // ------------------------------
    // CLEAN EMAIL
    // ------------------------------

    const cleanEmail = email.trim().toLowerCase();

    // ------------------------------
    // FIND USER + BRANCH
    // ------------------------------

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.branch_id,
        u.full_name,
        u.email,
        u.password_hash,
        u.role,
        b.branch_name,
        b.location
      FROM users u
      LEFT JOIN branches b
        ON u.branch_id = b.id
      WHERE LOWER(u.email) = $1
      `,
      [cleanEmail]
    );

    // ------------------------------
    // USER NOT FOUND
    // ------------------------------

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    // ------------------------------
    // COMPARE PASSWORD
    // ------------------------------

    const passwordMatch = await bcrypt.compare(
      password,
      user.password_hash
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // ------------------------------
    // CREATE JWT
    // ------------------------------

    const token = jwt.sign(
      {
        userId: user.id,
        branchId: user.branch_id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      }
    );

    // ------------------------------
    // SUCCESSFUL LOGIN
    // ------------------------------

    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        branch_id: user.branch_id,
        branch_name: user.branch_name,
        location: user.location,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      success: false,
      message: "Server error during login.",
    });
  }
});

// ======================================================
// ENSURE PROFILE COLUMNS EXIST (phone, avatar_url, avatar_color, updated_at)
// ======================================================
let _profileColumnsEnsured = false;
async function ensureProfileColumns() {
  if (_profileColumnsEnsured) return;
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(30)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_color VARCHAR(20)`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()`);
    _profileColumnsEnsured = true;
  } catch (e) {
    console.warn("ensureProfileColumns warning:", e.message);
  }
}

// ======================================================
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

router.get(
  "/me",
  authenticateToken,
  async (req, res) => {
    try {
      await ensureProfileColumns();
      let result;
      try {
        result = await pool.query(
          `
          SELECT
            u.id,
            u.branch_id,
            u.full_name,
            u.email,
            u.role,
            u.phone,
            u.avatar_url,
            u.avatar_color,
            u.created_at,
            u.updated_at,
            b.branch_name,
            b.location
          FROM users u
          LEFT JOIN branches b ON u.branch_id = b.id
          WHERE u.id = $1
          `,
          [req.user.userId]
        );
      } catch (colErr) {
        // fallback if columns still missing
        result = await pool.query(
          `
          SELECT
            u.id,
            u.branch_id,
            u.full_name,
            u.email,
            u.role,
            b.branch_name,
            b.location
          FROM users u
          LEFT JOIN branches b ON u.branch_id = b.id
          WHERE u.id = $1
          `,
          [req.user.userId]
        );
      }

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: "User not found." });
      }
      const user = result.rows[0];
      res.json({
        success: true,
        user: {
          id: user.id,
          branch_id: user.branch_id,
          branch_name: user.branch_name,
          location: user.location,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          phone: user.phone || null,
          avatar_url: user.avatar_url || null,
          avatar_color: user.avatar_color || null,
          created_at: user.created_at || null,
          updated_at: user.updated_at || null,
        },
      });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ success: false, message: "Server error." });
    }
  }
);

// ======================================================
// ADD STAFF / CASHIER
// POST /api/auth/staff
// OWNER ONLY
// ======================================================

router.post(
  "/staff",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const {
        full_name,
        email,
        password,
        branch_id,
      } = req.body;

      // ------------------------------
      // CHECK REQUIRED FIELDS
      // ------------------------------

      if (
        !full_name ||
        !email ||
        !password ||
        !branch_id
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Full name, email, password, and branch are required.",
        });
      }

      // ------------------------------
      // CLEAN INPUT
      // ------------------------------

      const cleanName = full_name.trim();
      const cleanEmail = email.trim().toLowerCase();
      const branchId = Number(branch_id);

      // ------------------------------
      // VALIDATE BRANCH ID
      // ------------------------------

      if (
        !Number.isInteger(branchId) ||
        branchId <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Invalid branch ID.",
        });
      }

      // ------------------------------
      // VALIDATE PASSWORD
      // ------------------------------

      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message:
            "Password must be at least 6 characters.",
        });
      }

      // ------------------------------
      // CHECK EMAIL
      // ------------------------------

      const existingUser = await pool.query(
        `
        SELECT id
        FROM users
        WHERE LOWER(email) = $1
        `,
        [cleanEmail]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      // ------------------------------
      // CHECK BRANCH
      // ------------------------------

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
          message:
            "Selected branch does not exist.",
        });
      }

      const branch = branchResult.rows[0];

      // ------------------------------
      // HASH PASSWORD
      // ------------------------------

      const passwordHash = await bcrypt.hash(
        password,
        10
      );

      // ------------------------------
      // CREATE STAFF
      // ------------------------------

      const result = await pool.query(
        `
        INSERT INTO users (
          branch_id,
          full_name,
          email,
          password_hash,
          role
        )
        VALUES ($1, $2, $3, $4, 'cashier')
        RETURNING
          id,
          branch_id,
          full_name,
          email,
          role,
          created_at
        `,
        [
          branchId,
          cleanName,
          cleanEmail,
          passwordHash,
        ]
      );

      const staff = result.rows[0];

      // ------------------------------
      // LOG
      // ------------------------------

      console.log(
        "================================="
      );
      console.log(
        "NEW STAFF ACCOUNT CREATED"
      );
      console.log(
        "Created by:",
        req.user.userId
      );
      console.log(
        "Staff ID:",
        staff.id
      );
      console.log(
        "Staff Name:",
        staff.full_name
      );
      console.log(
        "Staff Email:",
        staff.email
      );
      console.log(
        "Branch:",
        branch.branch_name
      );
      console.log(
        "Role:",
        staff.role
      );
      console.log(
        "================================="
      );

      // ------------------------------
      // RESPONSE
      // ------------------------------

      res.status(201).json({
        success: true,
        message:
          "Staff account created successfully.",
        staff: {
          id: staff.id,
          branch_id: staff.branch_id,
          branch_name: branch.branch_name,
          location: branch.location,
          full_name: staff.full_name,
          email: staff.email,
          role: staff.role,
          created_at: staff.created_at,
        },
      });
    } catch (error) {
      console.error(
        "Create staff error:",
        error
      );

      // Duplicate email protection
      if (error.code === "23505") {
        return res.status(409).json({
          success: false,
          message:
            "A user with this email already exists.",
        });
      }

      // Invalid branch
      if (error.code === "23503") {
        return res.status(400).json({
          success: false,
          message: "Invalid branch.",
          error: error.detail,
        });
      }

      res.status(500).json({
        success: false,
        message:
          "Server error while creating staff account.",
      });
    }
  }
);

// ======================================================
// UPDATE OWN PROFILE
// PUT /api/auth/profile
// Supports: full_name, email, phone, avatar_url, avatar_color
// ======================================================

router.put(
  "/profile",
  authenticateToken,
  async (req, res) => {
    try {
      await ensureProfileColumns();
      const userId = req.user.userId;
      const { full_name, email, phone, avatar_url, avatar_color } = req.body;

      if (!full_name || !String(full_name).trim()) {
        return res.status(400).json({ success: false, message: "Full name is required." });
      }
      if (!email || !String(email).trim()) {
        return res.status(400).json({ success: false, message: "Email is required." });
      }

      const cleanName = String(full_name).trim();
      const cleanEmail = String(email).trim().toLowerCase();
      const cleanPhone = phone !== undefined && phone !== null && String(phone).trim() !== "" ? String(phone).trim() : null;
      const cleanAvatarUrl = avatar_url !== undefined && avatar_url !== null && String(avatar_url).trim() !== "" ? String(avatar_url).trim().slice(0, 5000) : null;
      const cleanAvatarColor = avatar_color !== undefined && avatar_color !== null && String(avatar_color).trim() !== "" ? String(avatar_color).trim().slice(0, 20) : null;

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email format." });
      }
      if (cleanName.length < 2 || cleanName.length > 80) {
        return res.status(400).json({ success: false, message: "Full name must be 2-80 characters." });
      }
      if (cleanPhone && !/^[0-9+\-() ]{7,20}$/.test(cleanPhone)) {
        return res.status(400).json({ success: false, message: "Phone must be 7-20 digits, may include + - ( ) and spaces." });
      }
      const allowedColors = ["pink", "purple", "blue", "emerald", "amber", "rose", "indigo", "teal"];
      if (cleanAvatarColor && !allowedColors.includes(cleanAvatarColor) && !/^#[0-9a-fA-F]{6}$/.test(cleanAvatarColor)) {
        return res.status(400).json({ success: false, message: "Invalid avatar color." });
      }

      const existing = await pool.query(`SELECT id FROM users WHERE LOWER(email) = $1 AND id <> $2`, [cleanEmail, userId]);
      if (existing.rows.length > 0) {
        return res.status(409).json({ success: false, message: "Email is already taken by another account." });
      }

      // Try full update with new columns, fallback to basic if columns missing
      let result;
      try {
        result = await pool.query(
          `UPDATE users SET full_name=$1, email=$2, phone=$3, avatar_url=$4, avatar_color=$5, updated_at=NOW() WHERE id=$6
           RETURNING id, branch_id, full_name, email, role, phone, avatar_url, avatar_color, created_at, updated_at`,
          [cleanName, cleanEmail, cleanPhone, cleanAvatarUrl, cleanAvatarColor, userId]
        );
      } catch (colErr) {
        console.warn("Fallback profile update without new columns:", colErr.message);
        result = await pool.query(
          `UPDATE users SET full_name=$1, email=$2 WHERE id=$3 RETURNING id, branch_id, full_name, email, role`,
          [cleanName, cleanEmail, userId]
        );
      }

      if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found." });

      const updated = result.rows[0];
      const branchRes = await pool.query(`SELECT branch_name, location FROM branches WHERE id=$1`, [updated.branch_id]);

      const userPayload = {
        id: updated.id,
        branch_id: updated.branch_id,
        branch_name: branchRes.rows[0]?.branch_name || null,
        location: branchRes.rows[0]?.location || null,
        full_name: updated.full_name,
        email: updated.email,
        role: updated.role,
        phone: updated.phone ?? cleanPhone ?? null,
        avatar_url: updated.avatar_url ?? cleanAvatarUrl ?? null,
        avatar_color: updated.avatar_color ?? cleanAvatarColor ?? null,
        created_at: updated.created_at || null,
        updated_at: updated.updated_at || null,
      };

      res.json({ success: true, message: "Profile updated successfully.", user: userPayload });
    } catch (error) {
      console.error("Update profile error:", error);
      if (error.code === "23505") return res.status(409).json({ success: false, message: "Email already exists." });
      res.status(500).json({ success: false, message: "Failed to update profile." });
    }
  }
);

// ======================================================
// CHANGE PASSWORD
// PUT /api/auth/change-password
// ======================================================

router.put(
  "/change-password",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = req.user.userId;
      const { currentPassword, newPassword } = req.body;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Current and new password are required." });
      }
      if (String(newPassword).length < 6) {
        return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
      }
      if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: "New password must be different from current password." });
      }

      const result = await pool.query(`SELECT password_hash FROM users WHERE id = $1`, [userId]);
      if (result.rows.length === 0) return res.status(404).json({ success: false, message: "User not found." });

      const match = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
      if (!match) return res.status(401).json({ success: false, message: "Current password is incorrect." });

      const hash = await bcrypt.hash(newPassword, 10);
      await pool.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [hash, userId]);

      res.json({ success: true, message: "Password changed successfully." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ success: false, message: "Failed to change password." });
    }
  }
);

// ======================================================
// GET STAFF LIST
// GET /api/auth/staff
// OWNER ONLY
// ======================================================

router.get(
  "/staff",
  authenticateToken,
  requireOwner,
  async (req, res) => {
    try {
      const result = await pool.query(
        `
        SELECT
          u.id,
          u.branch_id,
          u.full_name,
          u.email,
          u.role,
          u.created_at,
          b.branch_name,
          b.location
        FROM users u
        LEFT JOIN branches b
          ON u.branch_id = b.id
        WHERE u.role = 'cashier'
        ORDER BY u.id DESC
        `
      );

      res.json({
        success: true,
        staff: result.rows,
      });
    } catch (error) {
      console.error(
        "Get staff error:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          "Server error while loading staff.",
      });
    }
  }
);

module.exports = router;