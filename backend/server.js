// Import required modules for the server
import express from 'express'; // Express framework for building the web server
import mongoose from 'mongoose'; // Mongoose for MongoDB interaction
import path from 'path'; // Path module for handling file paths
import { fileURLToPath } from 'url'; // URL module to resolve file paths in ES modules
import session from 'express-session'; // Session middleware for managing user sessions
import { registerUser } from './register.js'; // Function to handle user registration
import { loginUser } from './login.js'; // Function to handle user login
import { logoutUser } from './logout.js'; // Function to handle user logout
import { isAuthenticated } from './auth.js'; // Middleware to check if a user is authenticated
import cookieParser from 'cookie-parser'; // Middleware to parse cookies
import { registerLand } from './register-land.js';

// Initialize the Express application
const app = express();

// Configure cookie-parser middleware with a secret key
// Purpose: Parses cookies sent with requests, enabling signed cookies for secure data like user IDs
app.use(cookieParser('your-secret-key')); // Note: 'your-secret-key' should be stored in an environment variable for security

// Define the port for the server to listen on
const PORT = 5001; // Hardcoded port; consider using process.env.PORT for flexibility

// Resolve the current file's path (needed for ES modules)
const __filename = fileURLToPath(import.meta.url); // Gets the current file's URL
const __dirname = path.dirname(__filename); // Gets the directory of the current file

// MongoDB connection URI
const MONGO_URI = 'mongodb://localhost:27017/landRegistrationDB'; // Connects to a local MongoDB database named 'landRegistrationDB'

// Middleware setup
// Serve static assets (e.g., CSS, JS, images) from the frontend/assets directory
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets'))); // Maps '/assets' URL to the assets folder

// Parse incoming JSON request bodies
app.use(express.json()); // Enables the server to handle JSON data in POST/PUT requests

// Configure session middleware for user authentication
app.use(
    session({
        secret: 'your-secret-key', // Secret used to sign session cookies; should be stored in process.env.SESSION_SECRET
        resave: false, // Prevents resaving session if unmodified
        saveUninitialized: false, // Prevents creating sessions for unauthenticated users
        cookie: { secure: false }, // Set to true in production with HTTPS to secure cookies
    })
);

// Serve static files from the frontend directory with restrictions
app.use(
    express.static(path.join(__dirname, '../frontend'), {
        index: false, // Disables automatic serving of index.html to prevent directory listing
        setHeaders: (res, filePath) => {
            // Restrict direct access to home.html without authentication
            if (filePath.endsWith('home.html')) {
                res.status(403).send('Forbidden'); // Sends a 403 error if accessed directly
            }
        },
    })
);

// Connect to MongoDB
mongoose
    .connect(MONGO_URI) // Attempts to connect to the specified MongoDB URI
    .then(() => console.log('Connected to MongoDB')) // Logs success message on connection
    .catch((err) => console.error('Failed to connect:', err)); // Logs error if connection fails

// Define routes for serving HTML pages
// Route: Serve the landing page
app.get('/', (req, res) => {
    // Sends index.html from frontend/pages as the root page
    res.sendFile(path.join(__dirname, '../frontend/pages', 'index.html'));
});

// Route: Serve the login page
app.get('/login', (req, res) => {
    // Sends login.html from frontend/pages for user login
    res.sendFile(path.join(__dirname, '../frontend/pages', 'login.html'));
});

// Route: Serve the registration page
app.get('/register', (req, res) => {
    // Sends register.html from frontend/pages for user registration
    res.sendFile(path.join(__dirname, '../frontend/pages', 'register.html'));
});

// Route: Serve the home page (protected)
app.get('/home', isAuthenticated, (req, res) => {
    // Only accessible if isAuthenticated middleware passes
    // Sends home.html from frontend/pages
    res.sendFile(path.join(__dirname, '../frontend/pages', 'home.html'));
});

// Route: Serve the buyer page (protected)
app.get('/buyer', isAuthenticated, (req, res) => {
    // Only accessible to authenticated users
    // Sends buyer.html from frontend/pages, likely for users browsing land listings
    res.sendFile(path.join(__dirname, '../frontend/pages', 'buyer.html'));
});

app.get('/seller', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'seller.html'));
});

app.get('/logout', logoutUser); // Add logout route



// API Endpoints
app.post('/register', registerUser); // Register a new user
app.post('/login', loginUser); // Login an existing user



// SUGGESTION: Add a route to fetch user profile data (example for expansion)
// app.get('/api/profile', isAuthenticated, async (req, res) => {
//     const userId = req.signedCookies.auth;
//     try {
//         const user = await User.findById(userId).select('name username email'); // Assuming User model is imported
//         res.json(user);
//     } catch (error) {
//         res.status(500).json({ message: 'Error fetching profile' });
//     }
// });


// SUGGESTION: Add a route for land registration data input (example)
// app.post('/api/land', isAuthenticated, async (req, res) => {
//     const { title, location, size } = req.body;
//     // Add logic to save land data to a new MongoDB collection
//     res.status(201).json({ message: 'Land registered successfully' });
// });

// Start the server
app.listen(PORT, () => {
    // Starts the server and listens on the specified port
    console.log(`Server running on: http://localhost:${PORT}`);
});