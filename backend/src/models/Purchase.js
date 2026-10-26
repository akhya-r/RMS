const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
  ingredients: [
    {
      ingredient: { type: mongoose.Schema.Types.ObjectId, ref: "Ingredient", required: true },
      quantity: { type: Number, required: true, min: 1 },
      unit: { type: String, required: true },
      cost: { type: Number, required: true, min: 0 },
    },
  ],
  totalAmount: { type: Number, required: true, min: 0 },
  status: { type: String, enum: ["pending", "completed", "cancelled"], default: "pending" },
  paymentStatus: { type: String, enum: ["unpaid", "partial", "paid"], default: "unpaid" },
  paymentMethod: { type: String, enum: ["cash", "card", "transfer"] },
  notes: { type: String },
  receivedAt: { type: Date },
}, { timestamps: true });

purchaseSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
purchaseSchema.index({ supplier: 1, createdAt: -1 });

module.exports = mongoose.model("Purchase", purchaseSchema);