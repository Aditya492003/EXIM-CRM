import mongoose from "mongoose";
const { Schema } = mongoose;

const ProposalTemplateSchema = new Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    default: "",
  },
  category: {
    type: String,
    default: "Custom Upload",
  },
  format: {
    type: String,
    default: "DOCX",
  },
  status: {
    type: String,
    default: "Published",
  },
  usedCount: {
    type: Number,
    default: 0,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  cloudinaryPublicId: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  createdByClerkId: {
    type: String,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
});

const ProposalTemplate = mongoose.model("ProposalTemplate", ProposalTemplateSchema);

export default ProposalTemplate;
