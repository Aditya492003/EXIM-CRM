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
