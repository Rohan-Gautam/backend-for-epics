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

        // Set a signed cookie with user ID
        res.cookie('auth', user._id.toString(), { signed: true, httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 1 day expiry

        // Respond with success
        return res.status(200).json({ message: 'Login successful', user: { username: user.username } });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server error during login' });
    }
};

// EXAMPLE: Add a function to check if user is logged in
// export const checkLoginStatus = (req) => {
//     return req.signedCookies && req.signedCookies.auth ? true : false;
// };

// NOTES:
// - You can expand this with JWT tokens instead of cookies for more secure authentication.
// - Example: `const token = jwt.sign({ id: user._id }, 'secret-key'); res.json({ token });`