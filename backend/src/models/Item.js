const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: "Category", required: true },
  name: { type: String, required: true },
  description: { type: String },
  basePrice: { type: Number, required: true, min: 0 },
  isAvailable: { type: Boolean, default: true },
  trackInventory: { type: Boolean, default: false },
  requiresPreparation: { type: Boolean, default: true },
  preparationTime: { type: Number, min: 0 },
  displayOrder: { type: Number, default: 0 },
}, { timestamps: true });

itemSchema.index({ restaurant: 1, category: 1, isAvailable: 1 });

module.exports = mongoose.model("Item", itemSchema);