// ==========================================
// LOAD ENVIRONMENT VARIABLES FIRST
// ==========================================
require("dotenv").config();

const express = require("express");
const cors = require("cors");

const pool = require("./config/database");

const authRoutes = require("./routes/auth");
const menuRoutes = require("./routes/menu");
const inventoryRoutes = require("./routes/inventory");
const dashboardRoutes = require("./routes/dashboard");
const salesRoutes = require("./routes/sales");
const recipesRoutes = require("./routes/recipes");
const ingredientRoutes = require("./routes/ingredients");

// ==========================================
// CREATE APP
// ==========================================
const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:3000",
].filter(Boolean);

app.use(
  cors({
    origin: allowedOrigins.length > 0 && process.env.NODE_ENV === "production"
      ? allowedOrigins
      : true, // allow all in dev or if no FRONTEND_URL set
    credentials: true,
  })
);
app.use(express.json());

// ==========================================
// API ROUTES
// ========================================== 
app.use("/api/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/recipes", recipesRoutes);
app.use("/api/ingredients", ingredientRoutes);

// ==========================================
// TEST ROUTE
// ==========================================
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Taste It Cafe Backend API is running!",
  });
});

// ==========================================
// DATABASE TEST
// ==========================================
app.get("/api/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      message: "Database connected successfully!",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database test failed:", error);

    res.status(500).json({
      success: false,
      message: "Database connection failed.",
      error: error.message,
    });
  }
});

// ==========================================
// 404 HANDLER
// ==========================================
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
    path: req.originalUrl,
  });
});

// ==========================================
// GLOBAL ERROR HANDLER
// ==========================================
app.use((err, req, res, next) => {
  console.error("Unhandled server error:", err);

  res.status(500).json({
    success: false,
    message: "Internal server error.",
    error: err.message,
  });
});

// ==========================================
// START SERVER
// ==========================================
app.listen(PORT, () => {
  console.log(`Taste It Cafe backend running on http://localhost:${PORT}`);
});