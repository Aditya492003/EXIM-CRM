import mongoose from 'mongoose';
const { Schema } = mongoose;

const CompanySchema = new Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    industry: {
        type: String
    },
    primaryContact: {
        type: String
    },
    primaryContactId: {
        type: Schema.Types.ObjectId,
        ref: 'Contact'
    },
    phone: {
        type: String
    },
    email: {
        type: String
    },
    assignedManager: {
        type: String
    },
    assignedManagerClerkId: {
        type: String
    },
    status: {
        type: String,
        enum: ['Active', 'Inactive', 'Prospect'],
        default: 'Active'
    },
    revenue: {
        type: Number // Total value in ₹
    },
    activeDeals: {
        type: Number,
        default: 0
    },
    wonDeals: {
        type: Number,
        default: 0
    },
    openDeals: {
        type: Number,
        default: 0
    },
    lostDeals: {
        type: Number,
        default: 0
    },
    website: {
        type: String
    },
    address: {
        type: String
    },
    gstin: {
        type: String
    },
    pan: {
        type: String
    },
    logoUrl: {
        type: String // Cloudinary URL
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
    sharedWithManagerIds: {
        type: [String],
        default: [],
        index: true
    },
    ownerManagerName: {
        type: String
    },
    ownerManagerEmail: {
        type: String
    },
    createdDate: {
        type: Date,
        default: Date.now
    }
});

const Company = mongoose.model("Company", CompanySchema );

export default Company;