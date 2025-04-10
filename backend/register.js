import mongoose from 'mongoose';
import bcrypt from 'bcrypt';


// Define User Schema
const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:true,
    },
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});





// Create User Model
const User = mongoose.model('User', userSchema);






// Export the registration function
export const registerUser = async (req, res) => {
    const { name, username, email, password } = req.body;

    try {
        // Check if user already exists
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ message: 'Username or email already exists' });
        }


        const hashedPassword = await bcrypt.hash(password, 10);
        // Create new user
        const newUser = new User({
            name,
            username,
            email,
            password: hashedPassword // In production, hash this password (e.g., with bcrypt)
        });

        // Save to MongoDB
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: { username, email } });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

export default User; // Export the model for potential use elsewhere