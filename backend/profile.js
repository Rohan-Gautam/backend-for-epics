// Import Mongoose to interact with MongoDB
import mongoose from 'mongoose';

// Import User and Land models
import User from './register.js'; // Assumes User model is exported as default
import Land from './register-land.js';    // Assumes Land model is exported as default

// Function to get user profile details
export const getProfile = async (req, res) => {
    try {
        // Get user ID from signed cookie (assumes authentication middleware sets this)
        const userId = req.signedCookies.auth;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Fetch user details from User collection
        const user = await User.findById(userId).select('name email phoneNumber aadhaarNumber panNumber phoneNumber address dateOfBirth nationality gender fatherName occupation');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Respond with user details
        res.status(200).json({ user });
    } catch (error) {
        // Log error for debugging
        console.error('Get profile error:', error);
        // Return server error response
        res.status(500).json({ message: 'Server error while fetching profile' });
    }
};

// Function to get user's registered lands
export const getUserLands = async (req, res) => {
    try {
        // Get user ID from signed cookie
        const userId = req.signedCookies.auth;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Fetch all lands owned by the user
        const lands = await Land.find({ owner: userId }).select(
            'title description location area propertyType documentIds saleDescription images'
        );

        // Respond with the list of lands
        res.status(200).json({ lands });
    } catch (error) {
        // Log error for debugging
        console.error('Get lands error:', error);
        // Return server error response
        res.status(500).json({ message: 'Server error while fetching lands' });
    }
};

// Function to handle user logout
export const logout = (req, res) => {
    try {
        // Get user ID from signed cookie
        const userId = req.signedCookies.auth;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Clear the auth cookie
        res.clearCookie('auth', { signed: true });
        // Respond with success message
        res.status(200).json({ message: 'Logged out successfully' });
    } catch (error) {
        // Log error for debugging
        console.error('Logout error:', error);
        // Return server error response
        res.status(500).json({ message: 'Server error during logout' });
    }
};