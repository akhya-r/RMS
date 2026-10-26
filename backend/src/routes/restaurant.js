const Router = require("express").Router;
const { body, param, validationResult } = require("express-validator");
const { protect, restaurantOwner, branchOwner } = require("../middleware/auth");
const { Restaurant, Branch } = require("../models/Restaurant");
const { Subscription } = require("../models/Subscription");

const router = Router();

// GET /api/restaurants - Get all restaurants (super admin only)
router.get(
  "/",
  protect,
  authorize("super_admin"),
  async (req, res) => {
    try {
      const restaurants = await Restaurant.find()
        .populate("owner", "name email")
        .sort({ createdAt: -1 });
      res.json({
        success: true,
        count: restaurants.length,
        data: restaurants,
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// GET /api/restaurants/me - Get current user's restaurant
router.get(
  "/me",
  protect,
  async (req, res) => {
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
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// POST /api/restaurants - Create a new restaurant
router.post(
  "/",
  protect,
  authorize("super_admin"),
  [
    body("name", "Restaurant name is required").notEmpty().trim(),
    body("email", "Valid email required").isEmail().normalizeEmail(),
    body("address", "Restaurant address is required").notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, address } = req.body;

    try {
      const existingRestaurant = await Restaurant.findOne({ email });
      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant already exists" });
      }

      const restaurant = await Restaurant.create({
        name,
        email,
        address,
        owner: req.user.id,
        subscriptionPlan: "starter",
        subscriptionStatus: "trial",
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      });

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
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// POST /api/restaurants/:id/branches - Create a new branch
router.post(
  "/:id/branches",
  protect,
  restaurantOwner,
  [
    body("name", "Branch name is required").notEmpty().trim(),
    body("address", "Branch address is required").notEmpty().trim(),
  ],
  async (req, res) => {
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
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// GET /api/restaurants/:id/branches - Get all branches
router.get(
  "/:id/branches",
  protect,
  restaurantOwner,
  async (req, res) => {
    try {
      const branches = await Branch.find({ restaurant: req.params.id });
      res.json({
        success: true,
        count: branches.length,
        data: branches,
      });
    } catch (error) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

function authorize(...roles) {
  return function (req, res, next) {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Not authorized as an administrator",
      });
    }
    next();
  };
}

module.exports = router;