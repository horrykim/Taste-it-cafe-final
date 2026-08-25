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
// GET CURRENT USER
// GET /api/auth/me
// ======================================================

router.get(
  "/me",
  authenticateToken,
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
          b.branch_name,
          b.location
        FROM users u
        LEFT JOIN branches b
          ON u.branch_id = b.id
        WHERE u.id = $1
        `,
        [req.user.userId]
      );

      // ------------------------------
      // USER NOT FOUND
      // ------------------------------

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "User not found.",
        });
      }

      const user = result.rows[0];

      // ------------------------------
      // RETURN CURRENT USER
      // ------------------------------

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
        },
      });
    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      res.status(500).json({
        success: false,
        message: "Server error.",
      });
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