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
  createdByClerkId: {
    type: String,
  },
});

const Employee = mongoose.model('Employee', EmployeeSchema);

export default Employee;
