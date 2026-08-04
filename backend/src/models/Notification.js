import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
  },
  employeeEmail: {
    type: String,
  },
  employeeClerkId: {
    type: String,
  },
  senderName: {
    type: String,
    required: true,
    default: "Manager",
  },
  senderClerkId: {
    type: String,
  },
  workspaceManagerId: {
    type: String,
    index: true,
  },
  note: {
    type: String,
    required: true,
    trim: true,
  },
  read: {
    type: Boolean,
    default: false,
  },
  createdDate: {
    type: Date,
    default: Date.now,
    expires: 43200, // Automatically auto-deletes notification 12 hours after creation
  },
});

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
