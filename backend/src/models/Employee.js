import mongoose from 'mongoose';
const { Schema } = mongoose;

const EmployeeSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
  },
  role: {
    type: String,
    trim: true,
    default: 'Trade Consultant',
  },
  department: {
    type: String,
    trim: true,
    default: 'Sales',
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'On Leave'],
    default: 'Active',
  },
  joinedDate: {
    type: Date,
    default: Date.now,
  },
  clerkUserId: {
    type: String,
    sparse: true,
    unique: true,
  },
  workingStatus: {
    type: String,
    enum: ['Available', 'Working on Leads', 'On Leave'],
    default: 'Available',
  },
  lastLogin: {
    type: Date,
  },
  // Optional custom SMTP credentials for employee's own Gmail account
  smtpUser: {
    type: String,
    trim: true,
    lowercase: true,
  },
  smtpPass: {
    type: String,
    trim: true,
  },
  managerClerkId: {
    type: String,
    index: true,
  },
  managerName: {
    type: String,
    trim: true,
  },
  managerEmail: {
    type: String,
    trim: true,
  },
  hrName: {
    type: String,
    trim: true,
    default: 'Kate Middleton',
  },
  leadName: {
    type: String,
    trim: true,
    default: 'Eugene Hummell',
  },
  position: {
    type: String,
    trim: true,
  },
  onboardingRequired: {
    type: Boolean,
    default: true,
  },
  onboardingStatus: {
    type: String,
    default: 'Onboarding',
  },
  onboardingProgress: {
    type: Number,
    default: 38,
  },
  onboardingScripts: {
    type: Array,
    default: [
      { id: 'tour', name: 'Office Tour', active: true, percentage: 100 },
      { id: 'mgmt', name: 'Management Introductory', active: false, percentage: 0 },
      { id: 'tools', name: 'Work Tools', active: true, percentage: 20 },
      { id: 'colleagues', name: 'Meet Your Colleagues', active: true, percentage: 0 },
      { id: 'duties', name: 'Duties Journal', active: true, percentage: 0 },
      { id: 'requests', name: 'Requests Handling', active: true, percentage: 0 },
      { id: 'activity', name: 'Activity Tracking', active: true, percentage: 0 },
    ],
  },
  invitedBy: {
    type: String,
  },
  joinedAt: {
    type: Date,
    default: Date.now,
  },
});

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee;
