"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Subscription = exports.PLANS = void 0;
const mongoose_1 = require("mongoose");
exports.PLANS = {
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
            " Dedicated support",
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
};
const subscriptionSchema = new mongoose_1.Schema({
    restaurant: { type: mongoose_1.Schema.Types.ObjectId, ref: "Restaurant", required: true },
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
}, { timestamps: true });
// Index for faster queries
subscriptionSchema.index({ restaurant: 1 });
subscriptionSchema.index({ status: 1 });
exports.Subscription = (0, mongoose_1.model)("Subscription", subscriptionSchema);
//# sourceMappingURL=Subscription.js.map