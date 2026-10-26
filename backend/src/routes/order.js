const Router = require("express").Router;
const { body, param, validationResult } = require("express-validator");
const { protect, restaurantOwner, branchOwner } = require("../middleware/auth");
const { Restaurant, Branch, Menu, Category, Item, Order, Table } = require("../models/Restaurant");
const ApiError = require("../utils/apiError").default;

const router = Router();

// POST /api/orders - Create a new order
router.post(
  "/",
  [
    protect,
    restaurantOwner,
    body("type", "Order type required").isIn(["dine-in", "takeaway", "delivery"]),
    body("items", "Order items are required").isArray({ min: 1 }),
    body("tableNumber", "Table number required for dine-in").optional({ nullable: true }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, items, tableNumber, notes } = req.body;

    try {
      const restaurant = await Restaurant.findById(req.user?.restaurant);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      const validatedItems = await Promise.all(
        items.map(async (item) => {
          const menuItem = await Item.findOne({
            _id: item.item,
            restaurant: restaurant._id,
            isAvailable: true,
          });
          if (!menuItem) {
            throw new Error(`Item ${item.name} not found or not available`);
          }
          return {
            item: menuItem._id,
            name: menuItem.name,
            quantity: item.quantity || 1,
            price: menuItem.basePrice,
            modifiers: item.modifiers || [],
            variants: item.variants || [],
          };
        })
      );

      const subtotal = validatedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      const taxRate = restaurant.taxRate || 0.1;
      const tax = subtotal * taxRate;
      const total = subtotal + tax;

      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.random().toString(36).substr(2, 8).toUpperCase();
      const orderId = `ORD-${datePrefix}-${randomSuffix}`;

      let table = null;
      if (type === "dine-in" && tableNumber) {
        table = await Table.findOne({
          restaurant: restaurant._id,
          number: tableNumber,
        });
        if (!table) {
          return res.status(404).json({ message: "Table not found" });
        }
      }

      const order = await Order.create({
        restaurant: restaurant._id,
        type,
        orderId,
        status: "pending",
        tableNumber,
        table,
        orderItems: validatedItems,
        subtotal,
        tax,
        taxRate,
        total,
        notes,
        server: req.user?.id,
      });

      if (type !== "dine-in") {
        table = undefined;
      }

      if (table) {
        order.table = table._id;
        await order.save();
      }

      res.status(201).json({
        success: true,
        data: order,
        message: "Order created successfully",
      });
    } catch (error) {
      res.status(400).json({ message: error.message || "Server error" });
    }
  }
);

// GET /api/orders - Get all orders for restaurant
router.get(
  "/",
  protect,
  restaurantOwner,
  async (req, res) => {
    try {
      const orders = await Order.find({ restaurant: req.user?.restaurant })
        .populate("table", "number capacity")
        .sort({ createdAt: -1 });
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

// GET /api/orders/:id - Get single order
router.get(
  "/:id",
  protect,
  restaurantOwner,
  async (req, res) => {
    try {
      const order = await Order.findOne({
        _id: req.params.id,
        restaurant: req.user?.restaurant,
      })
        .populate("table", "number capacity")
        .populate("orderItems.item", "name basePrice");

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        success: true,
        data: order,
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// PATCH /api/orders/:id/status - Update order status
router.patch(
  "/:id/status",
  [
    protect,
    restaurantOwner,
    param("id", "Order ID is required").notEmpty(),
    body(
      "status",
      "Valid status required"
    ).isIn(["pending", "confirmed", "preparing", "ready", "served", "closed", "cancelled"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const order = await Order.findOneAndUpdate(
        { _id: req.params.id, restaurant: req.user?.restaurant },
        { status: req.body.status, updatedAt: new Date() },
        { new: true, runValidators: true }
      );

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      res.json({
        success: true,
        data: order,
        message: `Order status updated to ${req.body.status}`,
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// PATCH /api/orders/:id/pay - Process payment for order
router.patch(
  "/:id/pay",
  [
    protect,
    restaurantOwner,
    param("id", "Order ID is required").notEmpty(),
    body("paymentMethod", "Payment method required").isIn(["cash", "card", "mobile"]),
    body("amount", "Payment amount required").optional({ nullable: true }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const order = await Order.findOne({
        _id: req.params.id,
        restaurant: req.user?.restaurant,
      });

      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }

      if (req.body.amount && parseFloat(req.body.amount) !== order.total) {
        return res.status(400).json({
          message: `Payment amount must match order total: $${order.total.toFixed(2)}`,
        });
      }

      order.paymentStatus = "paid";
      order.paymentMethod = req.body.paymentMethod;
      order.paidAt = new Date();
      await order.save();

      res.json({
        success: true,
        data: order,
        message: "Payment processed successfully",
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

module.exports = router;