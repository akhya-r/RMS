const mongoose = require("mongoose");

const tableSchema = new mongoose.Schema({
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant", required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  number: { type: Number, required: true },
  capacity: { type: Number, required: true, min: 1 },
  status: { type: String, enum: ["available", "occupied", "reserved", "cleaning"], default: "available" },
}, { timestamps: true });

tableSchema.index({ restaurant: 1, status: 1 });

module.exports = mongoose.model("Table", tableSchema);