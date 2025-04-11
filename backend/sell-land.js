import mongoose from 'mongoose';
import User from './register.js'; // Import User model
import Land from './register-land.js';    // Import Land model

// Define the SellLand schema with additional fields
const SellLandSchema = new mongoose.Schema({
    user: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true }, // Default from User
    },
    land: {
        landId: { type: mongoose.Schema.Types.ObjectId, ref: 'Land', required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        location: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true, match: /^\d{6}$/ },
        },
        area: {
            value: { type: Number, required: true, min: 0 },
            unit: { type: String, required: true, enum: ['sqft', 'sqm', 'acre', 'hectare'] },
        },
        propertyType: { type: String, required: true, enum: ['residential', 'commercial', 'agricultural', 'industrial'] },
        documentIds: { type: [String], required: true, validate: v => v.length > 0 },
        saleDescription: { type: String },
        images: { type: [String], default: [] },
    },
    price: { type: Number, required: true, min: 0 },
    landImageUrl: { type: String }, // Optional new image URL for the listing
    negotiable: { type: Boolean, default: false }, // Is the price negotiable?
    contactPhoneNumber: { type: String }, // Optional override for user phone number
    status: { type: String, enum: ['pending', 'approved', 'declined'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
});

// Create the SellLand model
const SellLand = mongoose.model('SellLand', SellLandSchema);

// Function to handle selling a land
export const sellLand = async (req, res) => {
    try {
        // Get user ID from signed cookie
        const userId = req.signedCookies.auth;
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Fetch user details
        const user = await User.findById(userId).select('name email phoneNumber');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Extract details from request body
        const {
            landId,
            price,
            landImageUrl,
            negotiable,
            contactPhoneNumber,
        } = req.body;

        // Validate required fields
        if (!landId || !price || price < 0) {
            return res.status(400).json({ message: 'Land ID and a valid price are required' });
        }

        // Fetch land details
        const land = await Land.findById(landId);
        if (!land) {
            return res.status(404).json({ message: 'Land not found' });
        }

        // Check ownership
        if (land.owner.toString() !== userId) {
            return res.status(403).json({ message: 'You can only sell your own land' });
        }

        // Check if already listed
        const existingSale = await SellLand.findOne({ 'land.landId': landId });
        if (existingSale) {
            return res.status(400).json({ message: 'This land is already listed for sale' });
        }

        // Construct the sellLand document
        const sellLandData = {
            user: {
                userId: user._id,
                name: user.name,
                email: user.email,
                phoneNumber: user.phoneNumber,
            },
            land: {
                landId: land._id,
                title: land.title,
                description: land.description,
                location: land.location,
                area: land.area,
                propertyType: land.propertyType,
                documentIds: land.documentIds,
                saleDescription: land.saleDescription || '',
                images: land.images || [],
            },
            price,
            landImageUrl: landImageUrl || land.images[0] || '', // Use provided URL or first existing image
            negotiable: negotiable || false,
            contactPhoneNumber: contactPhoneNumber || user.phoneNumber, // Override phone if provided
            status: 'pending',
        };

        // Save to SellLand collection
        const sellLandEntry = await SellLand.create(sellLandData);

        // Respond with success
        res.status(201).json({
            message: 'Land listed for sale successfully',
            sellLand: sellLandEntry,
        });
    } catch (error) {
        console.error('Sell land error:', error);
        res.status(500).json({ message: 'Server error while listing land for sale' });
    }
};

// Export the model
export default SellLand;