import mongoose, { Schema, model } from "mongoose";

export interface ICategory {
  restaurant: mongoose.Types.ObjectId;
  menu: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  isActive: boolean;
  displayOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const categorySchema: Schema<ICategory> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    menu: { type: Schema.Types.ObjectId, ref: "Menu", required: true },
    name: { type: String, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default model<ICategory>("Category", categorySchema);