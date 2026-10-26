/* @ts-nocheck */
import { Router, Request, Response } from "express";
import { body, param, validationResult } from "express-validator";
import { protect, restaurantOwner, authorize } from "../middleware/auth";
import User from "../models/User";
import Restaurant from "../models/Restaurant";
import Branch from "../models/Branch";
import Subscription from "../models/Subscription";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const router = Router();

// @route   POST /api/auth/register
// @desc    Register a new user and restaurant
// @access  Public
router.post(
  "/register",
  [
    body("name", "Name is required").notEmpty().trim(),
    body("email", "Valid email required").isEmail().normalizeEmail(),
    body("password", "Password must be at least 6 characters").isLength({ min: 6 }),
    body("restaurantName", "Restaurant name is required").notEmpty().trim(),
    body("restaurantAddress", "Restaurant address is required").notEmpty().trim(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, restaurantName, restaurantAddress } = req.body;

    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Check if restaurant already exists
      const existingRestaurant = await Restaurant.findOne({ email });
      if (existingRestaurant) {
        return res.status(400).json({ message: "Restaurant already exists" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "restaurant_admin",
      });

      // Create restaurant
      const restaurant = await Restaurant.create({
        name: restaurantName,
        email,
        address: restaurantAddress,
        owner: user._id,
        subscriptionPlan: "starter",
        subscriptionStatus: "trial",
        trialStartsAt: new Date(),
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
      });

      // Assign restaurant to user
      user.restaurant = restaurant._id;
      await user.save();

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

      // Generate token
      const token = jwt.sign(
        { id: user._id, role: user.role, restaurant: user.restaurant },
        process.env.JWT_SECRET!,
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
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  "/login",
  [
    body("email", "Valid email required").isEmail().normalizeEmail(),
    body("password", "Password is required").exists(),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // Check if user exists
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check if user is active
      if (user.status === "inactive") {
        return res.status(401).json({ message: "User account is disabled" });
      }

      // Verify password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate token
      const token = jwt.sign(
        { id: user._id, role: user.role, restaurant: user.restaurant },
        process.env.JWT_SECRET!,
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
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

export default router;