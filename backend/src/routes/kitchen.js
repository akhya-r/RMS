const Router = require("express").Router;
const { param, body, validationResult } = require("express-validator");
const { protect, restaurantOwner } = require("../middleware/auth");
const { Order } = require("../models/Order");

const router = Router();

// GET /api/kitchen/orders - Get pending/preparing orders for kitchen
router.get(
  "/orders",
  [protect, restaurantOwner],
  async (req, res) => {
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
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// GET /api/kitchen/orders/:status - Get orders by status for kitchen
router.get(
  "/orders/:status",
  [protect, restaurantOwner],
  async (req, res) => {
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
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

module.exports = router;