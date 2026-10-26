import mongoose, { Schema, model, Document } from "mongoose";

export interface IOrderItem {
  item: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  modifiers?: Array<{
    modifier: mongoose.Types.ObjectId;
    name: string;
    priceDelta: number;
  }>;
  variants?: Array<{
    variant: mongoose.Types.ObjectId;
    name: string;
    priceDelta: number;
  }>;
}

export interface IOrder extends Document {
  restaurant: mongoose.Types.ObjectId;
  branch?: mongoose.Types.ObjectId;
  tableNumber?: number;
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "closed" | "cancelled";
  type: "dine-in" | "takeaway" | "delivery";
  paymentStatus: "unpaid" | "partial" | "paid" | "refunded";
  paymentMethod?: "cash" | "card" | "mobile" | "gift_card";
  subtotal: number;
  tax: number;
  discount: number;
  discountAmount?: number;
  taxRate?: number;
  tip?: number;
  total: number;
  orderId: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  orderItems: Array<IOrderItem>;
  table?: mongoose.Types.ObjectId;
  server?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
  closedAt?: Date;
}

const orderSchema: Schema<IOrder> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
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
    subtotal: { type: Number, default: 0, min: [0, "Subtotal must be positive"] },
    tax: { type: Number, default: 0, min: [0, "Tax must be positive"] },
    discount: { type: Number, default: 0, min: [0, "Discount must be positive"] },
    discountAmount: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    tip: { type: Number, default: 0 },
    total: { type: Number, default: 0, min: [0, "Total must be positive"] },
    orderId: {
      type: String,
      unique: true,
      index: true,
    },
    customerName: { type: String },
    customerPhone: { type: String },
    notes: { type: String },
    orderItems: [
      {
        item: { type: Schema.Types.ObjectId, ref: "Item", required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: [1, "Quantity must be at least 1"] },
        price: { type: Number, required: true, min: [0, "Price must be positive"] },
        modifiers: [
          {
            modifier: { type: Schema.Types.ObjectId, ref: "Modifier" },
            name: { type: String },
            priceDelta: { type: Number, default: 0 },
          },
        ],
        variants: [
          {
            variant: { type: Schema.Types.ObjectId, ref: "Variant" },
            name: { type: String },
            priceDelta: { type: Number, default: 0 },
          },
        ],
      },
    ],
    table: { type: Schema.Types.ObjectId, ref: "Table" },
    server: { type: Schema.Types.ObjectId, ref: "User" },
    closedAt: { type: Date },
  },
  { timestamps: true }
);

// Generate unique orderId before saving
orderSchema.pre("save", async function (next: any) {
  if (!this.orderId) {
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randomSuffix = Math.random().toString(36).substr(2, 8).toUpperCase();
    this.orderId = `ORD-${datePrefix}-${randomSuffix}`;
  }
  next();
});

// Index for faster queries
orderSchema.index({ restaurant: 1, status: 1, createdAt: -1 });
orderSchema.index({ orderId: 1 }, { unique: true });

export default model<IOrder>("Order", orderSchema);