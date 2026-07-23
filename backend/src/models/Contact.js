import mongoose from 'mongoose';
const { Schema } = mongoose;

const ContactSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  company: {
    type: String // Company Name
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
  designation: {
    type: String // e.g. "Export Manager"
  },
  avatarUrl: {
    type: String // Cloudinary URL
  },
  notes: {
    type: String
  },
  createdByClerkId: {
    type: String
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model("Contact", ContactSchema );

export default Contact;