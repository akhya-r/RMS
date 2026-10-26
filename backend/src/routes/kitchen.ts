import { Router, Request, Response } from "express";
import { param, body, validationResult } from "express-validator";
import { protect, restaurantOwner } from "../middleware/auth";
import Order from "../models/Order";

const router = Router();

// @route   WS endpoint will be handled by socket.io
// This route provides order status for kitchen display

// @route   GET /api/kitchen/orders
// @desc    Get pending/preparing orders for kitchen
// @access  Private - restaurant staff
router.get(
  "/orders",
  [protect, restaurantOwner],
  async (req: Request, res: Response) => {
    try {
      const orders = await Order.find({
        restaurant: req.user?.restaurant,
        status: { $in: ["pending", "confirmed", "preparing"] },
      })
        .populate("orderItems.item", "name")
        .sort({ createdAt: 1 });

      res.json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   GET /api/kitchen/orders/:status
// @desc    Get orders by status for kitchen
// @access  Private - restaurant staff
router.get(
  "/orders/:status",
  [protect, restaurantOwner],
  async (req: Request, res: Response) => {
    try {
      const orders = await Order.find({
        restaurant: req.user?.restaurant,
        status: req.params.status,
      })
        .populate("orderItems.item", "name")
        .sort({ createdAt: 1 });

      res.json({
        success: true,
        count: orders.length,
        data: orders,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

export default router;