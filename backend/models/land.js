// models/land.js
import mongoose from 'mongoose';

const landSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    landArea: { type: Number, required: true },
    landLocation: { type: String, required: true },
    landImage: { type: String, required: true },
    landDoc: { type: String, required: true },
    aadhaarDoc: { type: String },
    panDoc: { type: String },

    // User details to be copied from user model
    ownerName: { type: String },
    ownerAadhaarNumber: { type: String },
    ownerPanNumber: { type: String },
    ownerPhoneNumber: { type: String },
    ownerAddress: {
        line1: String,
        city: String,
        state: String,
        pincode: String
    },

    registrationDate: { type: Date, default: Date.now }
});

const Land = mongoose.model('Land', landSchema);
export default Land;