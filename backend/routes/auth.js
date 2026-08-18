const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const pool = require("../config/database");

const authenticateToken = require("../middleware/authMiddleware");

const router = express.Router();

// ==========================================
// LOGIN
// POST /api/auth/login
// ==========================================

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Find user
    const result = await pool.query(
      `
      SELECT
        id,
        branch_id,
        full_name,
        email,
        password_hash,
        role
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    // User not found
    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const user = result.rows[0];

    // Compare password with bcrypt hash
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

    // Create JWT
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

    // Successful login
    res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        id: user.id,
        branch_id: user.branch_id,
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

// ==========================================
// GET CURRENT USER
// GET /api/auth/me
// ==========================================

router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
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

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user: result.rows[0],
    });

  } catch (error) {
    console.error("Get current user error:", error);

    res.status(500).json({
      success: false,
      message: "Server error.",
    });
  }
});

module.exports = router;