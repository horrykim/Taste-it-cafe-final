const jwt = require("jsonwebtoken");

// ======================================================
// AUTHENTICATE TOKEN
// ======================================================

function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    // --------------------------------------------------
    // CHECK AUTHORIZATION HEADER
    // --------------------------------------------------

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Access token is required.",
      });
    }

    // Expected:
    // Bearer TOKEN

    const parts = authHeader.split(" ");

    if (
      parts.length !== 2 ||
      parts[0] !== "Bearer" ||
      !parts[1]
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format.",
      });
    }

    const token = parts[1];

    // --------------------------------------------------
    // VERIFY TOKEN
    // --------------------------------------------------

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    // --------------------------------------------------
    // STORE USER INFORMATION
    // --------------------------------------------------

    req.user = {
      userId: decoded.userId,
      branchId: decoded.branchId,
      role: decoded.role,
    };

    next();

  } catch (error) {
    console.error(
      "Authentication error:",
      error
    );

    // Token expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Your session has expired. Please log in again.",
      });
    }

    // Invalid token
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
// The requested branch should be supplied as:
// req.params.branch_id
//
// or:
// req.body.branch_id
//
// or:
// req.query.branch_id
//
// ======================================================

function requireBranchAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: "Authentication required.",
    });
  }

  // --------------------------------------------------
  // OWNER CAN ACCESS ALL BRANCHES
  // --------------------------------------------------

  if (req.user.role === "owner") {
    return next();
  }

  // --------------------------------------------------
  // GET REQUESTED BRANCH
  // --------------------------------------------------

  const requestedBranchId =
    req.params.branch_id ||
    req.body?.branch_id ||
    req.query?.branch_id;

  // If no branch was specified,
  // use the user's assigned branch.

  if (!requestedBranchId) {
    req.branchId = req.user.branchId;
    return next();
  }

  // --------------------------------------------------
  // VALIDATE BRANCH ID
  // --------------------------------------------------

  const requestedId = Number(
    requestedBranchId
  );

  const userBranchId = Number(
    req.user.branchId
  );

  if (
    !Number.isInteger(requestedId) ||
    requestedId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid branch ID.",
    });
  }

  // --------------------------------------------------
  // CHECK USER BRANCH
  // --------------------------------------------------

  if (
    requestedId !== userBranchId
  ) {
    return res.status(403).json({
      success: false,
      message:
        "You do not have permission to access this branch.",
    });
  }

  // Store validated branch
  req.branchId = requestedId;

  next();
}

// ======================================================
// EXPORT
// ======================================================

module.exports = authenticateToken;
module.exports.authenticateToken =
  authenticateToken;
module.exports.requireOwner =
  requireOwner;
module.exports.requireBranchAccess =
  requireBranchAccess;
