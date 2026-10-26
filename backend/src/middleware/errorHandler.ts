import { NextFunction, Request, Response } from "express";
import ApiError from "../utils/apiError";
import logger from "../utils/logger";

// 404 handler - routes not found
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const statusCode = 404;
  next(new ApiError(statusCode, `${req.originalUrl} not found`));
};

// Global error handler
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Error handler caught:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate field value entered. ${Object.keys(err.keyValue)[0]} already exists.`;
    return res.status(400).json({ message });
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((e: any) => e.message)
      .join(", ");
    return res.status(400).json({ message });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ message: "Invalid token" });
  }
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({ message: "Token expired" });
  }

  // Default: send error response
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  res.status(statusCode).json({ message });
};