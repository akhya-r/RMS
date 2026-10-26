const jwt = require("jsonwebtoken");
const User = require("../models/User").default;
const ApiError = require("../utils/apiError").default;
const logger = require("../utils/logger");

exports.protect = async function (req, res, next) {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found with this token",
        });
      }

      if (req.user.status === "inactive") {
        return res.status(401).json({
          success: false,
          message: "User account is disabled",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Not authorized, token failed",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token",
    });
  }
};

exports.authorize = function (...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized as an administrator",
      });
    }
    next();
  };
};

exports.restaurantOwner = async function (req, res, next) {
  if (!req.user?.restaurant) {
    return res.status(403).json({
      success: false,
      message: "Access denied: No restaurant assigned",
    });
  }

  if (req.params.restaurantId && req.params.restaurantId !== req.user.restaurant.toString()) {
    return res.status(403).json({
      success: false,
      message: "Access denied: Not your restaurant",
    });
  }

  next();
};

exports.branchOwner = async function (req, res, next) {
  if (!req.user?.restaurant) {
    return res.status(403).json({
      success: false,
      message: "Access denied: No restaurant assigned",
    });
  }

  if (req.params.branchId) {
    const Branch = require("../models/Branch").default;
    const branch = await Branch.findById(req.params.branchId);
    if (!branch || branch.restaurant.toString() !== req.user.restaurant.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Not your branch",
      });
    }
  }

  next();
};