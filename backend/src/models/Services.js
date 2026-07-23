import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    category: {
        type: String,
        required: true,
        trim: true,
    },

    description: {
        type: String,
        trim: true,
    },

    price: {
        type: Number,
    },

    duration: {
        type: String,
        trim: true,
    },

    status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
    },

    features: [
        {
            type: String,
            trim: true,
        },
    ],

    createdByClerkId: {
        type: String,
    },

    createdDate: {
        type: Date,
        default: Date.now,
    },
});

const Service = mongoose.model("Service", serviceSchema);

export default Service;