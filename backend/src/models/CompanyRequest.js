import mongoose from "mongoose";
const { Schema } = mongoose;

const CompanyRequestSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
  companyName: {
    type: String,
    required: true,
  },
  ownerManagerId: {
    type: String,
    required: true,
    index: true,
  },
  ownerManagerName: {
    type: String,
  },
  ownerManagerEmail: {
    type: String,
  },
  requestorManagerId: {
    type: String,
    required: true,
    index: true,
  },
  requestedByClerkId: {
    type: String,
    required: true,
  },
  requestedByName: {
    type: String,
    required: true,
  },
  requestedByEmail: {
    type: String,
  },
  requestedByRole: {
    type: String,
    enum: ["manager", "employee"],
    default: "manager",
  },
  reason: {
    type: String,
    default: "",
  },
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
    index: true,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  resolvedDate: {
    type: Date,
  },
});

const CompanyRequest = mongoose.model("CompanyRequest", CompanyRequestSchema);

export default CompanyRequest;
