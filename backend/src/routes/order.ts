import { Router, Request, Response } from "express";
import { param, body, validationResult } from "express-validator";
import { protect, restaurantOwner, branchOwner, authorize } from "../middleware/auth";
import { User, Restaurant, Branch, Menu, Category, Item, Order, Table } from "../models";
import ApiError from "../utils/apiError";

const router = Router();

// @route   POST /api/orders
// @desc    Create a new order (POS)
// @access  Private - restaurant staff
router.post(
  "/",
  [
    protect,
    restaurantOwner,
    body("type", "Order type required").isIn(["dine-in", "takeaway", "delivery"]),
    body("items", "Order items are required").isArray({ min: 1 }),
    body("tableNumber", "Table number required for dine-in").optional({ nullable: true }),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { type, items, tableNumber, notes } = req.body;

    try {
      // Check restaurant exists and user has access
      const restaurant = await Restaurant.findById(req.user?.restaurant);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Validate all items exist and get prices
      const validatedItems = await Promise.all(
        items.map(async (item: any) => {
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

      // Calculate subtotal
      const subtotal = validatedItems.reduce(
        (sum: number, item: any) => sum + item.price * item.quantity,
        0
      );

      // Calculate tax
      const taxRate = restaurant.taxRate || 0.1; // default 10%
      const tax = subtotal * taxRate;

      // Calculate total
      const total = subtotal + tax;

      // Generate order ID (idempotency)
      const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      const randomSuffix = Math.random().toString(36).substr(2, 8).toUpperCase();
      const orderId = `ORD-${datePrefix}-${randomSuffix}`;

      // Determine table
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

      // Create order
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
        taxRate: taxRate,
        total,
        notes,
        server: req.user?.id,
      });

      // If takeaway or delivery, no table needed
      if (type !== "dine-in") {
        table = undefined;
      }

      // Update order with table if needed
      if (table) {
        order.table = table._id;
        await order.save();
      }

      res.status(201).json({
        success: true,
        data: order,
        message: "Order created successfully",
      });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Server error" });
    }
  }
);

// @route   GET /api/orders
// @desc    Get all orders for restaurant
// @access  Private - restaurant staff
router.get(
  "/",
  [protect, restaurantOwner],
  async (req: Request, res: Response) => {
    try {
      const orders = await Order.find({ restaurant: req.user?.restaurant })
        .populate("table", "number capacity")
        .sort({ createdAt: -1 });
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

// @route   GET /api/orders/:id
// @desc    Get single order
// @access  Private
router.get(
  "/:id",
  [protect, restaurantOwner],
  async (req: Request, res: Response) => {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   PATCH /api/orders/:id/status
// @desc    Update order status (kitchen display)
// @access  Private - restaurant staff
router.patch(
  "/:id/status",
  [
    protect,
    restaurantOwner,
    param("id", "Order ID is required").notEmpty(),
    body("status", "Valid status required").isIn([
      "pending",
      "confirmed",
      "preparing",
      "ready",
      "served",
      "closed",
      "cancelled",
    ]),
  ],
  async (req: Request, res: Response) => {
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
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   PATCH /api/orders/:id/pay
// @desc    Process payment for order
// @access  Private - restaurant staff
router.patch(
  "/:id/pay",
  [
    protect,
    restaurantOwner,
    param("id", "Order ID is required").notEmpty(),
    body("paymentMethod", "Payment method required").isIn(["cash", "card", "mobile"]),
    body("amount", "Payment amount required").optional({ nullable: true }),
  ],
  async (req: Request, res: Response) => {
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

      // If amount provided, validate it matches total
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
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

export default router;