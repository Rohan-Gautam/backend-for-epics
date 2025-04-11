import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Add session management
import { registerUser } from './register.js';
import { loginUser } from './login.js';
import { logoutUser } from './logout.js'; // Import logoutUser
import { isAuthenticated } from './auth.js'; // Import authentication middleware
import { isGovtAuthenticated, restrictToGovernment } from './govt-auth.js'; // Import government authentication middleware
import cookieParser from 'cookie-parser';
import govtEmpRoutes from './govt-emp.js';

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
        if (filePath.endsWith('Govt-verification.html')) {
            res.status(403).send('Forbidden'); // Prevent direct access to Govt-verification.html
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

app.get('/logout', logoutUser); // Add logout route

// Government routes with authentication
app.get('/pages/Government/Govt-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/Government', 'Govt-login.html'));
});

app.get('/pages/Government/Govt-emp-register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/Government', 'Govt-emp-register.html'));
});

// Government verification page with proper authentication
app.get('/pages/Government/Govt-verification.html', isGovtAuthenticated, restrictToGovernment, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/Government', 'Govt-verification.html'));
});

// API Endpoints
app.post('/register', registerUser); // Register a new user
app.post('/login', loginUser); // Login an existing user

app.use(govtEmpRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});