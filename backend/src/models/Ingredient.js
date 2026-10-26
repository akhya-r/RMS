const mongoose = require("mongoose");

const ingredientSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  name: { type: String, required: true },
  unit: { type: String, enum: ["kg", "g", "lb", "pcs", "liter", "ml"], required: true },
  currentStock: { type: Number, default: 0, min: 0 },
  minimumStock: { type: Number, default: 1, min: 1 },
  alertThreshold: { type: Number, default: 20, min: 0, max: 100 },
  costPerUnit: { type: Number, default: 0, min: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Ingredient", ingredientSchema);