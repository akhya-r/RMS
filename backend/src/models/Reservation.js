const mongoose = require("mongoose");

const reservationSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  table: { type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  partySize: { type: Number, required: true, min: 1 },
  date: { type: Date, required: true },
  time: { type: String, required: true },
  status: { type: String, enum: ["pending", "confirmed", "completed", "cancelled"], default: "pending" },
  notes: { type: String },
  checkedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },
}, { timestamps: true });

reservationSchema.index({ restaurant: 1, date: 1, time: 1, status: 1 });
reservationSchema.index({ table: 1, date: 1, status: 1 });

module.exports = mongoose.model("Reservation", reservationSchema);