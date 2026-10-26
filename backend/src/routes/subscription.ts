import { Router, Request, Response } from "express";
import { param, body, validationResult } from "express-validator";
import { protect, restaurantOwner } from "../middleware/auth";
import { Restaurant, Subscription } from "../models";

const router = Router();

// @route   GET /api/subscriptions
// @desc    Get current subscription for restaurant
// @access  Private - restaurant owner
router.get(
  "/",
  [protect, restaurantOwner],
  async (req: Request, res: Response) => {
    try {
      const subscription = await Subscription.findOne({
        restaurant: req.user?.restaurant,
      });

      const restaurant = await Restaurant.findById(req.user?.restaurant);

      res.json({
        success: true,
        data: {
          subscription,
          planDetails: restaurant?.subscriptionPlan
            ? {
                name: restaurant.subscriptionPlan,
                price: {
                  starter: 29,
                  professional: 79,
                  enterprise: 199,
                }[restaurant.subscriptionPlan],
              }
            : null,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   POST /api/subscriptions/plan
// @desc    Update subscription plan
// @access  Private - restaurant owner
router.post(
  "/plan",
  [
    protect,
    restaurantOwner,
    body("plan", "Plan is required").isIn(["starter", "professional", "enterprise"]),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { plan } = req.body;

    try {
      const restaurant = await Restaurant.findById(req.user?.restaurant);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      // Update restaurant plan
      restaurant.subscriptionPlan = plan;
      
      // Set appropriate pricing and trial
      const planInfo = {
        starter: { price: 29, trialDays: 14 },
        professional: { price: 79, trialDays: 30 },
        enterprise: { price: 199, trialDays: 30 },
      };

      const info = planInfo[plan as keyof typeof planInfo];
      restaurant.subscriptionStatus = "active";
      
      if (restaurant.subscriptionStatus === "trial") {
        restaurant.trialStartsAt = new Date();
        restaurant.trialEndsAt = new Date(Date.now() + info.trialDays * 24 * 60 * 60 * 1000);
      }

      await restaurant.save();

      // Update or create subscription record
      let subscription = await Subscription.findOneAndUpdate(
        { restaurant: restaurant._id },
        {
          plan,
          status: restaurant.subscriptionStatus,
          currentPeriodStartsAt: new Date(),
          currentPeriodEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // monthly
        },
        { new: true, upsert: true }
      );

      res.json({
        success: true,
        data: {
          restaurant,
          subscription,
          planPrice: info.price,
        },
        message: `Subscription plan updated to ${plan}`,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

// @route   POST /api/subscriptions/cancel
// @desc    Cancel subscription
// @access  Private - restaurant owner
router.post(
  "/cancel",
  [
    protect,
    restaurantOwner,
  ],
  async (req: Request, res: Response) => {
    try {
      const restaurant = await Restaurant.findById(req.user?.restaurant);
      if (!restaurant) {
        return res.status(404).json({ message: "Restaurant not found" });
      }

      restaurant.subscriptionStatus = "canceled";
      await restaurant.save();

      const subscription = await Subscription.findOneAndUpdate(
        { restaurant: restaurant._id },
        {
          status: "canceled",
          canceledAt: new Date(),
        },
        { new: true }
      );

      res.json({
        success: true,
        data: { restaurant, subscription },
        message: "Subscription canceled successfully",
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message || "Server error" });
    }
  }
);

export default router;