import mongoose, { Schema, model } from "mongoose";

export interface IIngredient {
  restaurant: mongoose.Types.ObjectId;
  name: string;
  unit: "kg" | "g" | "lb" | "pcs" | "liter" | "ml";
  currentStock: number;
  minimumStock: number;
  alertThreshold: number;
  costPerUnit: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const ingredientSchema: Schema<IIngredient> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    unit: {
      type: String,
      enum: ["kg", "g", "lb", "pcs", "liter", "ml"],
      required: true,
    },
    currentStock: { type: Number, default: 0, min: [0, "Stock cannot be negative"] },
    minimumStock: { type: Number, default: 1, min: [1, "Minimum stock must be at least 1"] },
    alertThreshold: { type: Number, default: 20, min: [0, "Alert threshold must be between 0-100"], max: [100, "Alert threshold must be between 0-100"] },
    costPerUnit: { type: Number, default: 0, min: [0, "Cost per unit must be positive"] },
  },
  { timestamps: true }
);

export default model<IIngredient>("Ingredient", ingredientSchema);