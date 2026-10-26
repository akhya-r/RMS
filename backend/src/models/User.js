const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ["super_admin", "restaurant_admin", "staff", "viewer"], default: "staff" },
  status: { type: String, enum: ["active", "inactive"], default: "active" },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: "Restaurant" },
}, { timestamps: true });

userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);