import mongoose from 'mongoose';
const { Schema } = mongoose;

const ProposalSectionSchema = new Schema(
  {
    title: {
      type: String
    },
    content: {
      type: String
    }
  },
  { _id: false }
);

const ProposalSchema = new Schema({
  number: {
    type: String,
    unique: true // e.g. "PRO-2025-001"
  },
  client: {
    type: String
  },
  clientId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact'
  },
  service: {
    type: String
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },
  value: {
    type: Number // in ₹
  },
  status: {
    type: String,
    enum: ['Draft', 'Sent', 'Under Review', 'Approved', 'Rejected', 'Expired'],
    default: 'Draft'
  },
  validTill: {
    type: Date
  },
  sections: {
    type: [ProposalSectionSchema],
    default: []
  },
  attachmentUrl: {
    type: String // Cloudinary URL for uploaded document/PDF
  },
  templateId: {
    type: Schema.Types.ObjectId
  },
  createdByClerkId: {
    type: String
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  sentDate: {
    type: Date
  },
  approvedDate: {
    type: Date
  }
});

const Proposal = mongoose.model("Proposal", ProposalSchema);

export default Proposal;