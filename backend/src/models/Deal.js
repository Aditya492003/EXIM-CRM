import mongoose from 'mongoose';
const { Schema } = mongoose;

const DealSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true // Deal Title
  },
  company: {
    type: String
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  leadId: {
    type: Schema.Types.ObjectId,
    ref: 'Lead'
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact'
  },
  value: {
    type: Number // in ₹
  },
  stage: {
    type: String,
    enum: [
      'New',
      'Qualified',
      'Proposal Sent',
      'Negotiation',
      'Won',
      'Lost'
    ],
    default: 'New'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  assignedTo: {
    type: String
  },
  assignedToClerkId: {
    type: String
  },
  service: {
    type: String
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },
  expectedCloseDate: {
    type: Date
  },
  closedDate: {
    type: Date // Set when stage moves to "Won" or "Lost"
  },
  notes: {
    type: String
  },
  createdByClerkId: {
    type: String
  },
  workspaceManagerId: {
    type: String,
    index: true
  },
  collaborators: [
    {
      clerkId: String,
      name: String,
      email: String,
      role: String,
      managerId: String,
      managerName: String,
      joinedAt: { type: Date, default: Date.now }
    }
  ],
  collaboratingWorkspaceIds: {
    type: [String],
    default: [],
    index: true
  },
  timeline: [
    {
      activity: String,
      performedBy: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const Deal = mongoose.model("Deal", DealSchema );

export default Deal;