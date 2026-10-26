import mongoose, { Schema, model } from "mongoose";

export interface IPlan {
  name: "starter" | "professional" | "enterprise";
  price: number; // monthly price in USD
  features: string[];
  limits: {
    maxRestaurants: number;
    maxBranches: number;
    maxUsers: number;
    maxOrdersPerMonth: number;
    maxStorageGB: number;
  };
  trialDays: number;
}

export const PLANS = {
  starter: {
    name: "starter",
    price: 29,
    features: [
      "1 restaurant",
      "3 branches",
      "5 users",
      "1000 orders/month",
      "10 GB storage",
    ],
    limits: {
      maxRestaurants: 1,
      maxBranches: 3,
      maxUsers: 5,
      maxOrdersPerMonth: 1000,
      maxStorageGB: 10,
    },
    trialDays: 14,
  },
  professional: {
    name: "professional",
    price: 79,
    features: [
      "3 restaurants",
      "10 branches",
      "15 users",
      "5000 orders/month",
      "50 GB storage",
      "Advanced analytics",
      "Priority support",
    ],
    limits: {
      maxRestaurants: 3,
      maxBranches: 10,
      maxUsers: 15,
      maxOrdersPerMonth: 5000,
      maxStorageGB: 50,
    },
    trialDays: 30,
  },
  enterprise: {
    name: "enterprise",
    price: 199,
    features: [
      "Unlimited restaurants",
      "Unlimited branches",
      "Unlimited users",
      "Unlimited orders",
      "200 GB storage",
      "Custom analytics",
      "Dedicated support",
      "API access",
    ],
    limits: {
      maxRestaurants: Number.MAX_SAFE_INTEGER,
      maxBranches: Number.MAX_SAFE_INTEGER,
      maxUsers: Number.MAX_SAFE_INTEGER,
      maxOrdersPerMonth: Number.MAX_SAFE_INTEGER,
      maxStorageGB: 200,
    },
    trialDays: 30,
  },
} as const;

export type TPlanKey = keyof typeof PLANS;

interface ISubscription {
  restaurant: mongoose.Types.ObjectId;
  plan: TPlanKey;
  status: "trial" | "active" | "past_due" | "canceled" | "expired";
  trialStartsAt: Date;
  trialEndsAt: Date;
  currentPeriodStartsAt: Date;
  currentPeriodEndsAt: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const subscriptionSchema: Schema<ISubscription> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    plan: {
      type: String,
      enum: ["starter", "professional", "enterprise"],
      required: true,
    },
    status: {
      type: String,
      enum: ["trial", "active", "past_due", "canceled", "expired"],
      default: "trial",
    },
    trialStartsAt: { type: Date, required: true },
    trialEndsAt: { type: Date, required: true },
    currentPeriodStartsAt: { type: Date, required: true },
    currentPeriodEndsAt: { type: Date, required: true },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    canceledAt: { type: Date },
  },
  { timestamps: true }
);

// Index for faster queries
subscriptionSchema.index({ restaurant: 1 });
subscriptionSchema.index({ status: 1 });

const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
export default Subscription;
export { Subscription };