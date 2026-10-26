import mongoose, { Schema, model } from "mongoose";

export interface IBranch {
  name: string;
  restaurant: mongoose.Types.ObjectId;
  address: string;
  phone?: string;
  status: "active" | "inactive";
  createdAt?: Date;
  updatedAt?: Date;
}

const branchSchema: Schema<IBranch> = new Schema(
  {
    name: { type: String, required: true },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    address: { type: String, required: true },
    phone: { type: String },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default model<IBranch>("Branch", branchSchema);