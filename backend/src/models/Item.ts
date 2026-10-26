import mongoose, { Schema, model } from "mongoose";

export interface IItem {
  restaurant: mongoose.Types.ObjectId;
  category: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  basePrice: number;
  isAvailable: boolean;
  trackInventory: boolean;
  requiresPreparation: boolean;
  preparationTime?: number;
  displayOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const itemSchema: Schema<IItem> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    name: { type: String, required: true },
    description: { type: String },
    basePrice: { type: Number, required: true, min: [0, "Price must be positive"] },
    isAvailable: { type: Boolean, default: true },
    trackInventory: { type: Boolean, default: false },
    requiresPreparation: { type: Boolean, default: true },
    preparationTime: { type: Number, min: 0 },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

itemSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });

export default model<IItem>("Item", itemSchema);