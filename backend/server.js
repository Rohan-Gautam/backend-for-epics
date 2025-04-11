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
import { getProfile, getUserLands, logout } from './profile.js';
import { sellLand } from './sell-Land.js';

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

// Route: Handle user logout
app.get('/logout', logoutUser); // Calls logoutUser function to clear session/cookies

// Route: Serve land registration page (protected)
app.get('/register-land', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'register-land.html'));
});
// Serve profile.html
app.get('/profile', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'profile.html'));
});

// New profile routes
app.get('/api/user/profile', isAuthenticated, getProfile); // Get user profile
app.get('/api/user/lands', isAuthenticated, getUserLands); // Get user's lands
app.post('/api/logout', isAuthenticated, logout);          // Logout user


app.post('/api/sell-land', isAuthenticated, sellLand);

app.get('/sell-land', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'sell-land.html'));
});



// API endpoints for user authentication
// Endpoint: Register a new user
app.post('/register', registerUser); // Handles POST requests to create a new user using registerUser function

// Endpoint: Log in an existing user
app.post('/login', loginUser); // Handles POST requests to authenticate users using loginUser function

app.post('/api/land/register', isAuthenticated, registerLand);

// Start the server
app.listen(PORT, () => {
    // Starts the server and listens on the specified port
    console.log(`Server running on: http://localhost:${PORT}`);
});