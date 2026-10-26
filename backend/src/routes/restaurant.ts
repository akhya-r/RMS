import { Router, Request, Response } from "express";
import { param, body, validationResult } from "express-validator";
import { protect, restaurantOwner, branchOwner, authorize } from "../middleware/auth";
import User from "../models/User";
import Restaurant from "../models/Restaurant";
import Branch from "../models/Branch";
import Subscription from "../models/Subscription";

const router = Router();

// @route   GET /api/restaurants
// @desc    Get all restaurants (super admin only)
// @access  Private - super admin
router.get(
  "/",
  protect,
  authorize("super_admin"),
  async (req: Request, res: Response) => {
    try {
      const restaurants = await Restaurant.find()
        .populate("owner", "name email")
        .sort({ createdAt: -1 });
      res.json({
        success: true,
        count: restaurants.length,
        data: restaurants,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   GET /api/restaurants/me
// @desc    Get current user's restaurant
// @access  Private
router.get(
  "/me",
  protect,
  async (req: Request, res: Response) => {
    try {
      if (!req.user?.restaurant) {
        return res.status(404).json({
          success: false,
          message: "No restaurant assigned to this user",
        });
      }

      const restaurant = await Restaurant.findById(req.user.restaurant)
        .populate("owner", "name email");

      res.json({
        success: true,
        data: restaurant,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   POST /api/restaurants
// @desc    Create a new restaurant (super admin only)
// @access  Private - super admin
router.post(
  "/",
  protect,
  authorize("super_admin"),
  [
    body("name", "Restaurant name is required").notEmpty().trim(),
    body("email", "Valid email required").isEmail().normalizeEmail(),
    body("address", "Restaurant address is required").notEmpty().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, address } = req.body;

    try {
      // Check if restaurant already exists
      const existingRestaurant = await Restaurant.findOne({ email });
      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant already exists" });
      }

      const restaurant = await Restaurant.create({
        name,
        email,
        address,
        owner: req.user!.id,
        subscriptionPlan: "starter",
        subscriptionStatus: "trial",
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

      // Create subscription
      await Subscription.create({
        restaurant: restaurant._id,
        plan: "starter",
        status: "trial",
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        currentPeriodStartsAt: new Date(),
        currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      });

      res.status(201).json({
        success: true,
        data: restaurant,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   POST /api/restaurants/:id/branches
// @desc    Create a new branch for restaurant
// @access  Private - restaurant owner
router.post(
  "/:id/branches",
  [
    protect,
    restaurantOwner,
    body("name", "Branch name is required").notEmpty().trim(),
    body("address", "Branch address is required").notEmpty().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, address } = req.body;

    try {
      const branch = await Branch.create({
        name,
        restaurant: req.params.id,
        address,
        status: "active",
      });

      res.status(201).json({
        success: true,
        data: branch,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   GET /api/restaurants/:id/branches
// @desc    Get all branches for restaurant
// @access  Private - restaurant owner
router.get(
  "/:id/branches",
  [protect, restaurantOwner],
  async (req: Request, res: Response) => {
    try {
      const branches = await Branch.find({ restaurant: req.params.id });
      res.json({
        success: true,
        count: branches.length,
        data: branches,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

export default router;