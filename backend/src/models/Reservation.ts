import mongoose, { Schema, model } from "mongoose";

export interface IReservation {
  restaurant: mongoose.Types.ObjectId;
  branch?: mongoose.Types.ObjectId;
  table: mongoose.Types.ObjectId;
  customerName: string;
  customerPhone: string;
  partySize: number;
  date: Date;
  time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  createdAt?: Date;
}

const reservationSchema: Schema<IReservation> = new Schema(
  {
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant", required: true },
    branch: { type: Schema.Types.ObjectId, ref: "Branch" },
    table: { type: Schema.Types.ObjectId, ref: "Table", required: true },
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    partySize: { type: Number, required: true, min: 1 },
    date: { type: Date, required: true },
    time: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    notes: { type: String },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: { type: Date },
  },
  { timestamps: true }
);

reservationSchema.index({ restaurant: 1, date: 1, time: 1, status: 1 });
reservationSchema.index({ table: 1, date: 1, status: 1 });

export default model<IReservation>("Reservation", reservationSchema);