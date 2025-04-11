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
    createdAt: { type: Date, default: Date.now },
    resetPasswordToken: { type: String }, // Add for password reset
    resetPasswordExpires: { type: Date }, // Add for password reset expiry
});

const User = mongoose.model('User', userSchema);

// Modify the registerLand function in register-land.js to write to lands.json

export const registerLand = async (req, res) => {
    // Existing code remains...
    
    try {
        // Get user ID from signed cookie, based on server.js session authentication
        const userId = req.signedCookies.auth;
        // Verify user is authenticated
        if (!userId) {
            // Return unauthorized error if no user ID is found
            return res.status(401).json({ message: 'User not authenticated' });
        }

        // Fetch user details from User collection
        const user = await User.findById(userId).select('name email phoneNumber');
        // Check if user exists in the database
        if (!user) {
            // Return not found error if user doesn't exist
            return res.status(404).json({ message: 'User not found' });
        }

        // Create a new land document
        const newLand = new Land({
            // Assign user ID as owner
            owner: userId,
            // Automatically pass user details from UserSchema
            userDetails: {
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
            },
            // Assign land details from request body
            title,
            description,
            location,
            area,
            propertyType,
            documentIds,
            saleDescription,
            images,
        });

        // Save the land document to MongoDB
        await newLand.save();
        
        // NEW CODE: Add the land to lands.json file
        const fs = require('fs').promises;
        const path = require('path');
        
        // Path to lands.json (adjust if needed)
        const landsFilePath = path.join(__dirname, '../public/data/lands.json');
        
        try {
            // Read existing lands
            let landsData = [];
            try {
                const fileContent = await fs.readFile(landsFilePath, 'utf8');
                landsData = JSON.parse(fileContent);
            } catch (readError) {
                // If file doesn't exist or is invalid, start with empty array
                console.log('Creating new lands.json file');
            }
            
            // Generate a new ID (typically done by the database, but we'll simulate it)
            const newId = landsData.length > 0 ? Math.max(...landsData.map(land => land.id)) + 1 : 1;
            
            // Create land object for JSON file
            const landForJson = {
                id: newId,
                title: title,
                location: `${location.city}, ${location.state}`,
                landType: propertyType.charAt(0).toUpperCase() + propertyType.slice(1),
                price: 0, // Default price (will be updated when listed for sale)
                size: area.value,
                image: images && images.length > 0 ? images[0] : "/assets/images/default-land.jpg",
                description: description,
                ownerId: userId, // Add owner ID to track ownership
                status: "available", // Initial status
                registrationDate: new Date().toISOString()
            };
            
            // Add to array
            landsData.push(landForJson);
            
            // Write back to file
            await fs.writeFile(landsFilePath, JSON.stringify(landsData, null, 2), 'utf8');
            
        } catch (fileError) {
            console.error('Error updating lands.json:', fileError);
            // Note: We don't want to fail the registration if JSON update fails
            // So we just log the error but continue with successful response
        }

        // Respond with success message and minimal land details
        res.status(201).json({
            message: 'Land registered successfully',
            land: { title, owner: userId },
        });
    } catch (error) {
        // Existing error handling code...
    }
};

export default User;