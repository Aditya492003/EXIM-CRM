import mongoose from "mongoose";
const { Schema } = mongoose;

const CollaborationRequestSchema = new Schema({
  entityType: {
    type: String,
    enum: ["Lead", "Deal"],
    required: true,
    index: true,
  },
  entityId: {
    type: Schema.Types.ObjectId,
    required: true,
    index: true,
  },
  entityTitle: {
    type: String,
    required: true,
  },
  companyName: {
    type: String,
  },
  contactName: {
    type: String,
  },
  serviceName: {
    type: String,
  },
  requesterClerkId: {
    type: String,
    required: true,
    index: true,
  },
  requesterName: {
    type: String,
    required: true,
  },
  requesterEmail: {
    type: String,
  },
  requesterRole: {
    type: String,
    enum: ["manager", "employee"],
    default: "employee",
  },
  requesterManagerId: {
    type: String,
    index: true,
  },
  requesterManagerName: {
    type: String,
  },
  ownerClerkId: {
    type: String,
    required: true,
    index: true,
  },
  ownerName: {
    type: String,
    required: true,
  },
  ownerManagerId: {
    type: String,
    index: true,
  },
  ownerManagerName: {
    type: String,
  },
  ownerManagerEmail: {
    type: String,
  },
  reason: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected", "Cancelled", "Expired"],
    default: "Pending",
    index: true,
  },
  requestedAt: {
    type: Date,
    default: Date.now,
  },
  respondedAt: {
    type: Date,
  },
});

const CollaborationRequest = mongoose.model("CollaborationRequest", CollaborationRequestSchema);

export default CollaborationRequest;
