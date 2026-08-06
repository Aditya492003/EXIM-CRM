import mongoose from 'mongoose';
const { Schema } = mongoose;

const LeadSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String
  },
  companyPhone: {
    type: String
  },
  companyEmail: {
    type: String
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  phone: {
    type: String
  },
  email: {
    type: String
  },
  service: {
    type: String // Service Name
  },
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },
  source: {
    type: String,
    enum: [
      'Website',
      'Referral',
      'Cold Call',
      'LinkedIn',
      'Exhibition',
      'Trade Show',
      'Email Campaign',
      'Partner',
      'Google Ads',
      'Other'
    ]
  },
  assignedTo: {
    type: String
  },
  assignedToClerkId: {
    type: String
  },
  status: {
    type: String,
    enum: [
      'New',
      'Contacted',
      'Interested',
      'Proposal Sent',
      'Negotiation',
      'Converted',
      'Lost',
      'Inactive'
    ],
    default: 'New'
  },
  notes: {
    type: String
  },
  enquiryStatus: {
    type: String
  },
  deadReason: {
    type: String
  },
  websiteUrl: {
    type: String
  },
  companySize: {
    type: String
  },
  region: {
    type: String
  },
  meetingType: {
    type: String
  },
  meetingDate: {
    type: Date
  },
  meetingMode: {
    type: String
  },
  meetingOutcome: {
    type: String
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  createdDate: {
    type: Date,
    default: Date.now
  },
  lastContacted: {
    type: Date
  },
  nextFollowUp: {
    type: Date
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
  ]
});

const Lead = mongoose.model("Lead", LeadSchema);

export default Lead;