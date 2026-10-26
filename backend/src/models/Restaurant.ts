import mongoose, { Schema, model, Document } from "mongoose";

export interface IRestaurant extends Document {
  name: string;
  description?: string;
  owner: mongoose.Types.ObjectId;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  country?: string;
  postalCode?: string;
  status: "active" | "inactive";
  subscriptionPlan?: "starter" | "professional" | "enterprise";
  subscriptionStatus?: "trial" | "active" | "past_due" | "canceled";
  trialEndsAt?: Date;
  trialDaysRemaining?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const restaurantSchema: Schema<IRestaurant> = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    phone: { type: String },
    address: { type: String, required: true },
    city: { type: String },
    country: { type: String },
    postalCode: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    subscriptionPlan: {
      type: String,
      enum: ["starter", "professional", "enterprise"],
    },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "past_due", "canceled"],
      default: "trial",
    },
    trialEndsAt: { type: Date },
    trialDaysRemaining: { type: Number, default: 14 },
  },
  { timestamps: true }
);

restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ email: 1 });

export default model<IRestaurant>("Restaurant", restaurantSchema);