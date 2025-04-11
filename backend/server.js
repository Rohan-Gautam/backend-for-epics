import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Add session management
import { registerUser } from './register.js';
import { loginUser } from './login.js';
import { logoutUser } from './logout.js'; // Import logoutUser
import { isAuthenticated } from './auth.js'; // Import authentication middleware
import cookieParser from 'cookie-parser';

const app = express();
app.use(cookieParser('your-secret-key')); // Cookie parser with a secret key for signed cookies

const PORT = 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = 'mongodb://localhost:27017/landRegistrationDB';

// Middleware
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets'))); // Serve static assets
app.use(express.json()); // Parse JSON bodies
app.use(
    session({
        secret: 'your-secret-key', // Replace with an environment variable in production (e.g., process.env.SESSION_SECRET)
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// Serve static files but restrict direct access to certain pages
app.use(express.static(path.join(__dirname, '../frontend'), {
    index: false, // Disable directory indexing
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('home.html')) {
            res.status(403).send('Forbidden'); // Prevent direct access to home.html without authentication
        }
    },
}));

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect:", err));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'index.html')); // Landing page
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'login.html')); // Login page
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'register.html')); // Registration page
});

app.get('/home', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'home.html')); // Protected home page
});


//for buyer

app.get('/buyer', isAuthenticated, (req, res) => {
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

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});

// NOTES:
// - To add more functionality, consider creating separate route files (e.g., `routes/userRoutes.js`) and importing them.
// - Example: `app.use('/api/users', userRoutes);`
// - For data input, create new schemas (e.g., Land) and endpoints to handle CRUD operations.
