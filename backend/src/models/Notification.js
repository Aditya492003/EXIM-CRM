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
    expires: 86400, // Automatically auto-deletes notification 24 hours after creation
  },
});

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
