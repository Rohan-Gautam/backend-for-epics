import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import session from 'express-session'; // Add session management
import { registerUser } from './register.js';
import { loginUser } from './login.js';
import { isAuthenticated } from './auth.js'; // Import authentication middleware
import cookieParser from 'cookie-parser';


const app = express();
app.use(cookieParser('your-secret-key'));

const PORT = 5001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGO_URI = 'mongodb://localhost:27017/landRegistrationDB';

// Middleware
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));
app.use(express.json());
app.use(
    session({
        secret: 'your-secret-key', // Replace with a secure secret key
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// Remove direct access to home.html by excluding it from static file serving
app.use(express.static(path.join(__dirname, '../frontend'), {
    index: false, // Disable directory indexing
    setHeaders: (res, filePath) => {
        if (filePath.endsWith('home.html')) {
            res.status(403).send('Forbidden'); // Block direct access to home.html
        }
    },
}));

// MongoDB Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => console.error("Failed to connect:", err));

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'register.html'));
});

app.get('/home', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages', 'home.html'));
});


app.post('/api/register', registerUser);
app.post('/api/login', loginUser);

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on: http://localhost:${PORT}`);
});

