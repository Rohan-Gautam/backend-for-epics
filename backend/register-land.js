// Import Mongoose to define schemas and interact with MongoDB
import mongoose from 'mongoose';

// Define the Land Schema to store land registration details
const LandSchema = new mongoose.Schema({
    // Reference to the user who owns this land
    owner: {
        type: mongoose.Schema.Types.ObjectId, // Stores the ObjectId of the user
        ref: 'User', // Links to the User model defined in register.js
        required: [true, 'Owner ID is required'], // Ensures every land has an owner
    },
    // User details automatically copied from UserSchema
    userDetails: {
        name: {
            type: String, // Stores the user’s name
            required: [true, 'User name is required'], // Ensures name is included
            trim: true, // Removes leading/trailing whitespace
        },
        email: {
            type: String, // Stores the user’s email
            required: [true, 'User email is required'], // Ensures email is included
            trim: true, // Removes leading/trailing whitespace
        },
        phoneNumber: {
            type: String, // Stores the user’s phone number
            required: [true, 'User phone number is required'], // Ensures phone number is included
            match: [/^[6-9]\d{9}$/, 'Invalid phone number format'], // Validates Indian phone number format
        },
    },
    // Title of the land
    title: {
        type: String, // Stores a descriptive title (e.g., "Sunny Farm")
        required: [true, 'Land title is required'], // Ensures title is provided
        trim: true, // Removes leading/trailing whitespace
    },
    // Description of the land
    description: {
        type: String, // Stores detailed information about the land
        required: [true, 'Description is required'], // Ensures description is provided
        trim: true, // Removes leading/trailing whitespace
    },
    // Location details of the land
    location: {
        address: {
            type: String, // Full address of the land
            required: [true, 'Address is required'], // Ensures address is provided
            trim: true, // Removes leading/trailing whitespace
        },
        city: {
            type: String, // City where the land is located
            required: [true, 'City is required'], // Ensures city is provided
            trim: true, // Removes leading/trailing whitespace
        },
        state: {
            type: String, // State where the land is located
            required: [true, 'State is required'], // Ensures state is provided
            trim: true, // Removes leading/trailing whitespace
        },
        pincode: {
            type: String, // Pincode of the land’s location
            required: [true, 'Pincode is required'], // Ensures pincode is provided
            match: [/^\d{6}$/, 'Pincode must be 6 digits'], // Enforces 6-digit format
        },
    },
    // Area of the land with value and unit
    area: {
        value: {
            type: Number, // Numerical size of the land
            required: [true, 'Area value is required'], // Ensures area value is provided
            min: [0, 'Area cannot be negative'], // Prevents negative values
        },
        unit: {
            type: String, // Unit of measurement
            required: [true, 'Area unit is required'], // Ensures unit is provided
            enum: ['sqft', 'sqm', 'acre', 'hectare'], // Restricts to valid units
        },
    },
    // Type of property
    propertyType: {
        type: String, // Category of the land
        required: [true, 'Property type is required'], // Ensures type is provided
        enum: ['residential', 'commercial', 'agricultural', 'industrial'], // Restricts to valid types
    },
    // Array of document IDs (e.g., legal documents)
    documentIds: [{
        type: String, // Stores document identifiers
        required: [true, 'Document ID is required'], // Ensures each ID is provided
        trim: true, // Removes leading/trailing whitespace
    }],
    // Date when the land was registered
    registrationDate: {
        type: Date, // Stores date and time
        default: Date.now, // Automatically sets to current time
    },
    // Status of the land
    status: {
        type: String, // Indicates availability
        required: [true, 'Status is required'], // Ensures status is provided
        enum: ['available', 'pending', 'sold'], // Restricts to valid statuses
        default: 'available', // Sets default to available
    },
    // Price of the land, required only if status is pending
    price: {
        type: Number, // Numerical price in INR
        required: function() { return this.status === 'pending'; }, // Conditional requirement
        min: [0, 'Price cannot be negative'], // Prevents negative values
    },
    // Description of the sale terms
    saleDescription: {
        type: String, // Stores additional sale details
        trim: true, // Removes leading/trailing whitespace
    },
    // Indicates if price is negotiable
    negotiable: {
        type: Boolean, // True if price can be negotiated
        default: false, // Defaults to non-negotiable
    },
    // Statistics for tracking engagement
    statistics: {
        views: {
            type: Number, // Number of times land was viewed
            default: 0, // Initializes to 0
        },
        likes: {
            type: Number, // Number of likes received
            default: 0, // Initializes to 0
        },
        inquiries: {
            type: Number, // Number of inquiries made
            default: 0, // Initializes to 0
        },
    },
    // Array of image URLs or paths
    images: [{
        type: String, // Stores image identifiers or URLs
        trim: true, // Removes leading/trailing whitespace
    }],
});

// Create the Land model from the schema
const Land = mongoose.model('Land', LandSchema);

// Import User model to fetch user details
import User from './register.js'; // Assumes User model is exported as default from register.js

// Function to register a new land for an authenticated user
export const registerLand = async (req, res) => {
    // Extract only the land details provided by the form from the request body
    const {
        title,
        description,
        location,
        area,
        propertyType,
        documentIds,
        saleDescription,
        images,
    } = req.body;

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
            // Return not found error if user doesn’t exist
            return res.status(404).json({ message: 'User not found' });
        }

        // Create a new land document
        const newLand = new Land({
            // Assign user ID as owner
            owner: userId,
            // Automatically pass user details from UserSchema
            userDetails: {
                name: user.name, // Copy name from User document
                email: user.email, // Copy email from User document
                phoneNumber: user.phoneNumber, // Copy phone number from User document
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
            // Note: price, negotiable, and status are not included here; they use schema defaults
        });

        // Save the land document to MongoDB
        await newLand.save();

        // Respond with success message and minimal land details
        res.status(201).json({
            message: 'Land registered successfully',
            land: { title, owner: userId },
        });
    } catch (error) {
        // Log error details for debugging
        console.error('Detailed land registration error:', error);
        // Handle Mongoose validation errors
        if (error.name === 'ValidationError') {
            // Map errors to an array of field-specific messages
            const errors = Object.values(error.errors).map(err => ({
                field: err.path, // Field causing the error
                message: err.message || `Invalid value for ${err.path}`, // Error description
            }));
            // Return validation error response
            return res.status(400).json({ message: 'Validation failed', errors });
        }
        // Return generic server error for other issues
        res.status(500).json({ message: 'Server error during land registration', error: error.message });
    }
};

// Export the Land model for potential use elsewhere
export default Land;