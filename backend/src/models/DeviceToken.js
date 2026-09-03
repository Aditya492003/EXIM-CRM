import mongoose from "mongoose";

const DeviceTokenSchema = new mongoose.Schema(
  {
    clerkUserId: {
      type: String,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
    },
    deviceInfo: {
      type: String,
      default: "Web Browser",
    },
    workspaceManagerId: {
      type: String,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const DeviceToken = mongoose.model("DeviceToken", DeviceTokenSchema);

export default DeviceToken;
