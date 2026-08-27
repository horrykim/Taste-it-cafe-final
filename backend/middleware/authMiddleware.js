const jwt = require("jsonwebtoken");
const pool = require("../config/database");

// ======================================================
// AUTHENTICATE TOKEN
//
// Supports two JWT sources:
//   1. Supabase Auth JWT (verified with SUPABASE_JWT_SECRET)
//   2. Legacy custom JWT (verified with JWT_SECRET)
//
// For Supabase tokens, the user is looked up by
// supabase_auth_id in the users table.
// ======================================================

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2 || parts[0] !== "Bearer" || !parts[1]) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = parts[1];

    // --------------------------------------------------
    // TRY SUPABASE JWT FIRST
    // --------------------------------------------------

    const supabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (supabaseJwtSecret) {
      try {
        const decoded = jwt.verify(token, supabaseJwtSecret);

        // Supabase JWT contains sub (auth user id)
        if (decoded.sub) {
          req.supabaseUserId = decoded.sub;

          // Look up the application user by supabase_auth_id
          return lookupSupabaseUser(decoded.sub, req, res, next);
        }
      } catch (supabaseErr) {
        // Not a Supabase token or invalid — fall through to legacy
      }
    }

    // --------------------------------------------------
    // FALLBACK: LEGACY CUSTOM JWT
    // --------------------------------------------------

    if (!process.env.JWT_SECRET) {
      return res.status(401).json({
        success: false,
        message: "Authentication configuration error.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      userId: decoded.userId,
      branchId: decoded.branchId,
      role: decoded.role,
    };

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid access token.",
      });
    }

    return res.status(401).json({
      success: false,
      message: "Authentication failed.",
    });
  }
}

// ======================================================
// LOOKUP SUPABASE USER
//
// Finds the application user by supabase_auth_id.
// If the column doesn't exist yet, falls back to legacy.
// ======================================================

async function lookupSupabaseUser(supabaseUserId, req, res, next) {
  try {
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
          u.supabase_auth_id,
          b.branch_name,
          b.location
        FROM users u
        LEFT JOIN branches b ON u.branch_id = b.id
        WHERE u.supabase_auth_id = $1
        `,
        [supabaseUserId]
      );
    } catch (colErr) {
      // supabase_auth_id column doesn't exist yet — try legacy lookup
      if (String(colErr.message).includes("supabase_auth_id")) {
        console.warn("supabase_auth_id column not found. Run migration. Falling back to token lookup.");
        return fallbackLookup(supabaseUserId, req, res, next);
      }
      throw colErr;
    }

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: "User not found. Please log in again.",
      });
    }

    const user = result.rows[0];

    req.user = {
      userId: user.id,
      branchId: user.branch_id,
      role: user.role,
      full_name: user.full_name,
      email: user.email,
      branch_name: user.branch_name,
      location: user.location,
      phone: user.phone,
      avatar_url: user.avatar_url,
      avatar_color: user.avatar_color,
    };

    next();
  } catch (error) {
    console.error("Supabase user lookup error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
}

// ======================================================
// FALLBACK LOOKUP
//
// When supabase_auth_id column doesn't exist, decode the
// Supabase JWT for email and look up by email.
// ======================================================

async function fallbackLookup(supabaseUserId, req, res, next) {
  try {
    // The Supabase JWT also has email in the payload
    // We can re-decode or pass it through — but since we already
    // verified the token, let's try a different approach:
    // Use the auth.users RPC or just fail gracefully

    return res.status(401).json({
      success: false,
      message: "Database migration required. Please add supabase_auth_id column to users table.",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Authentication error.",
    });
  }
}

// ======================================================
// OWNER ONLY
// ======================================================

function requireOwner(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role !== "owner") {
    return res.status(403).json({
      success: false,
      message: "Owner access required.",
    });
  }

  next();
}

// ======================================================
// BRANCH ACCESS
// ======================================================
//
// OWNER:
// Can access any branch.
//
// CASHIER:
// Can only access their assigned branch.
//
// ======================================================

function requireBranchAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  if (req.user.role === "owner") {
    return next();
  }

  const requestedBranchId =
    req.params.branch_id ||
    req.body?.branch_id ||
    req.query?.branch_id;

  if (!requestedBranchId) {
    req.branchId = req.user.branchId;
    return next();
  }

  const requestedId = Number(requestedBranchId);
  const userBranchId = Number(req.user.branchId);

  if (!Number.isInteger(requestedId) || requestedId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid branch ID.",
    });
  }

  if (requestedId !== userBranchId) {
    return res.status(403).json({
      success: false,
      message: "You do not have permission to access this branch.",
    });
  }

  req.branchId = requestedId;
  next();
}

// ======================================================
// EXPORT
// ======================================================

module.exports = authenticateToken;
module.exports.authenticateToken = authenticateToken;
module.exports.requireOwner = requireOwner;
module.exports.requireBranchAccess = requireBranchAccess;
