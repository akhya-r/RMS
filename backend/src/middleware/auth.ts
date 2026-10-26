/* @ts-nocheck */
import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import User from "../models/User";  // Changed from import { User } to import User (default export)
import ApiError from "../utils/apiError";  // This should work since we export default ApiError and also re-export
import logger from "../utils/logger";

export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);

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

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized as an administrator",
      });
    }
    next();
  };
};

export const restaurantOwner = async (req: Request, res: Response, next: NextFunction) => {
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

export const branchOwner = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.restaurant) {
    return res.status(403).json({
      success: false,
      message: "Access denied: No restaurant assigned",
    });
  }

  if (req.params.branchId) {
    const branch = await require("../models/Branch").default.findById(req.params.branchId);
    if (!branch || branch.restaurant.toString() !== req.user.restaurant.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied: Not your branch",
      });
    }
  }

  next();
};