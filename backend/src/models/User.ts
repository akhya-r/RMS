import mongoose, { Schema, model, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: "super_admin" | "restaurant_admin" | "staff" | "viewer";
  status: "active" | "inactive";
  restaurant?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const userSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*\.\w{2,}$/, "Please fill a valid email address"],
    },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["super_admin", "restaurant_admin", "staff", "viewer"],
      default: "staff",
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    restaurant: { type: Schema.Types.ObjectId, ref: "Restaurant" },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

export default model<IUser>("User", userSchema);