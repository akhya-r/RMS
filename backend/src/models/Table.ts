import mongoose, { Schema, model } from "mongoose";

export interface ITable {
  restaurant: mongoose.Types.ObjectId;
  branch?: mongoose.Types.ObjectId;
  number: number;
  capacity: number;
  status: "available" | "occupied" | "reserved" | "cleaning";
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

const tableSchema: Schema<ITable> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    number: { type: Number, required: true },
    capacity: { type: Number, required: true, min: 1 },
    status: {
      type: String,
      enum: ["available", "occupied", "reserved", "cleaning"],
      default: "available",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

tableSchema.index({ restaurant: 1, status: 1 });

export default model<ITable>("Table", tableSchema);