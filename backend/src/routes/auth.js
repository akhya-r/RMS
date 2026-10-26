const Router = require("express").Router;
const { body, param, validationResult } = require("express-validator");
const User = require("../models/User").default;
const Restaurant = require("../models/Restaurant").default;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const router = Router();

// POST /api/auth/register
router.post(
  "/register",
  [
    body("name", "Name is required").notEmpty().trim(),
    body("email", "Valid email required").isEmail().normalizeEmail(),
    body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    body("restaurantName", "Restaurant name is required").notEmpty().trim(),
    body("restaurantAddress", "Restaurant address is required").notEmpty().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, restaurantName, restaurantAddress } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      const existingRestaurant = await Restaurant.findOne({ email });
      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant already exists" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "restaurant_admin",
      });

      const restaurant = await Restaurant.create({
        name: restaurantName,
        email,
        address: restaurantAddress,
        owner: user._id,
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

      const token = jwt.sign(
        { id: user._id, role: user.role, restaurant: user.restaurant },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || "1d" }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurant: restaurant.name,
        },
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [
    body("email", "Valid email required").isEmail().normalizeEmail(),
    body("password", "Password is required").exists(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (user.status === "inactive") {
        return res.status(401).json({ message: "User account is disabled" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user._id, role: user.role, restaurant: user.restaurant },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || "1d" }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          restaurant: user.restaurant
            ? await Restaurant.findById(user.restaurant)?.name
            : null,
        },
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

module.exports = router;