import mongoose from 'mongoose';
const { Schema } = mongoose;

const MeetingSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: [
      'Discovery Call',
      'Follow-up',
      'Proposal Presentation',
      'QBR',
      'Demo',
      'Negotiation',
      'Closure'
    ]
  },
  company: {
    type: String
  },
  companyId: {
    type: Schema.Types.ObjectId,
    ref: 'Company'
  },
  attendee: {
    type: String // Contact person name
  },
  contactId: {
    type: Schema.Types.ObjectId,
    ref: 'Contact'
  },
  mode: {
    type: String // e.g. "Virtual (Google Meet)", "In-Person"
  },
  date: {
    type: Date
  },
  time: {
    type: String // e.g. "10:00"
  },
  duration: {
    type: String // e.g. "1 hour"
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Completed', 'Cancelled', 'Rescheduled'],
    default: 'Scheduled'
  },
  link: {
    type: String // Virtual meeting link
  },
  notes: {
    type: String
  },
  organizedByClerkId: {
    type: String
  },
  assignedToClerkId: {
    type: String // Clerk user ID of the assigned employee
  },
  assignedToName: {
    type: String // Display name of the assigned employee (denormalized)
  },
  outcomeStatus: {
    type: String,
    enum: ['', 'Done', 'Postponed', 'Cancelled'],
    default: ''
  },
  outcomeNotes: {
    type: String,
    default: ''
  },
  workspaceManagerId: {
    type: String,
    index: true
  },
  createdDate: {
    type: Date,
    default: Date.now
  }
});


const Meeting = mongoose.model("Meeting", MeetingSchema);

export default Meeting;