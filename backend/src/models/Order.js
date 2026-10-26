const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  modifiers: [
    {
      modifier: { type: mongoose.Schema.Types.ObjectId, ref: "Modifier" },
      name: { type: String },
      priceDelta: { type: Number, default: 0 },
    },
  ],
  variants: [
    {
      variant: { type: mongoose.Schema.Types.ObjectId, ref: "Variant" },
      name: { type: String },
      priceDelta: { type: Number, default: 0 },
    },
  ],
});

const orderSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  tableNumber: { type: Number },
  status: {
    type: String,
    enum: ["pending", "confirmed", "preparing", "ready", "served", "closed", "cancelled"],
    default: "pending",
  },
  type: {
    type: String,
    enum: ["dine-in", "takeaway", "delivery"],
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["unpaid", "partial", "paid", "refunded"],
    default: "unpaid",
  },
  paymentMethod: { type: String, enum: ["cash", "card", "mobile", "gift_card"] },
  subtotal: { type: Number, default: 0, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 },
  discountAmount: { type: Number, default: 0 },
  taxRate: { type: Number, default: 0 },
  tip: { type: Number, default: 0 },
  total: { type: Number, default: 0, min: 0 },
  orderId: { type: String, unique: true, index: true },
  customerName: { type: String },
  customerPhone: { type: String },
  notes: { type: String },
  orderItems: [orderItemSchema],
  table: { type: mongoose.Schema.Types.ObjectId, ref: "Table" },
  server: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  closedAt: { type: Date },
}, { timestamps: true });

orderSchema.pre("save", async function (next) {
  if (!this.orderId) {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.orderId = `ORD-${datePrefix}-${randomSuffix}`;
  }
  next();
});

orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 }, { unique: true });

module.exports = mongoose.model("Order", orderSchema);