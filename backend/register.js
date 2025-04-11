import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Define User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    aadhaarNumber: { type: String, required: true, unique: true, match: /^\d{12}$/ },
    panNumber: { type: String, required: true, unique: true, match: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/ },
    phoneNumber: { type: String, required: true, match: /^[6-9]\d{9}$/ },
    address: {
        line1: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true, match: /^\d{6}$/ },
    },
    dateOfBirth: { type: Date, required: true },
    nationality: { type: String, required: true, enum: ['Indian'], default: 'Indian' },
    gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
    fatherName: { type: String, required: true },
    occupation: { type: String, required: false },
    aadhaarDoc: { type: String }, // Path to Aadhaar document
    panDoc: { type: String }, // Path to PAN document
    createdAt: { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

export const registerUser = async (req, res) => {
    const {
        name, username, email, password, aadhaarNumber, panNumber, phoneNumber,
        address, dateOfBirth, nationality, gender, fatherName, occupation
    } = req.body;

    try {
        const existingUser = await User.findOne({
            $or: [{ username }, { email }, { aadhaarNumber }, { panNumber }]
        });
        if (existingUser) {
            return res.status(400).json({ message: 'Username, email, Aadhaar, or PAN already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            name, username, email, password: hashedPassword, aadhaarNumber, panNumber,
            phoneNumber, address, dateOfBirth, nationality, gender, fatherName, occupation,
        });

        await newUser.save();
        res.status(201).json({ message: 'User registered successfully', user: { username, email } });
        res.redirect('/login');
    } catch (error) {
        console.error('Detailed registration error:', error);
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => ({
                field: err.path,
                message: err.message || `Invalid value for ${err.path}`,
            }));
            return res.status(400).json({ message: 'Validation failed', errors });
        }
        res.status(500).json({ message: 'Server error during registration', error: error.message });
    }
};

export default User;