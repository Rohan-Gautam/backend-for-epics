// login.js
import bcrypt from 'bcrypt';
import User from './register.js'; // Import the User model

export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Set a signed cookie. Here we use the user's ID as the token.
        res.cookie('auth', user._id.toString(), { signed: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // expires in 1 day

        // Respond with success
        return res.status(200).json({ message: 'Login successful', user: { username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};
