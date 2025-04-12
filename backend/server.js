import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session';
import { registerUser } from './register.js';
import { loginUser } from './login.js';
import { logoutUser } from './logout.js';
import { isAuthenticated } from './auth.js';
import { isGovtAuthenticated, restrictToGovernment } from './govt-auth.js';
import cookieParser from 'cookie-parser';
import govtEmpRoutes from './govt-emp.js';

const app = express();
const SECRET_KEY = 'your-secret-key'; // In production, use environment variable

app.use(cookieParser(SECRET_KEY));

const PORT = 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = 'mongodb://localhost:27017/landRegistrationDB';

// Middleware
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use(express.json());
app.use(
    session({
        secret: SECRET_KEY,
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }
    })
);

// Log all requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
});

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect:", err));

// Serve static files - Basic routes that don't need protection
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'register.html'));
});

// Government login and registration pages (public access)
app.get('/pages/Government/Govt-login.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/Government', 'Govt-login.html'));
});

app.get('/pages/Government/Govt-emp-register.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/Government', 'Govt-emp-register.html'));
});

// Protected routes - Regular users
app.get('/home', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'home.html'));
});

app.get('/buyer', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'buyer.html'));
});

// Protected routes - Government employees only
app.get('/pages/Government/Govt-verification.html', isGovtAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/Government', 'Govt-verification.html'));
});

// Serve other static files but with protection against direct access to sensitive pages
app.use(express.static(path.join(__dirname, '../frontend'), {
    index: false,
    setHeaders: (res, filePath) => {
        // Prevent direct access to protected pages
        if (filePath.endsWith('home.html') || filePath.endsWith('Govt-verification.html')) {
            res.status(403).send('Forbidden: Authentication required');
        }
    },
}));

// API routes
app.post('/register', registerUser);
app.post('/login', loginUser);
app.get('/logout', logoutUser);

// Government employee routes
app.use(govtEmpRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server error:', err);
    res.status(500).send('Internal Server Error');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});