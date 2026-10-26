import mongoose, { Schema, model } from "mongoose";

export interface IMenu {
  restaurant: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const menuSchema: Schema<IMenu> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<IMenu>("Menu", menuSchema);