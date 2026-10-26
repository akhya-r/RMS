import mongoose, { Schema, model } from "mongoose";

export interface ISupplier {
  restaurant: mongoose.Types.ObjectId;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

const supplierSchema: Schema<ISupplier> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    contactName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default model<ISupplier>("Supplier", supplierSchema);