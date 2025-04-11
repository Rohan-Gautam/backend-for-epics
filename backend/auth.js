// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
    // Check session or signed cookie
    const userId = req.session.userId || req.signedCookies.auth;
    if (userId) {
        req.session.userId = userId; // Ensure session consistency
        next();
    } else {
        console.error('Authentication failed: No userId in session or cookies', {
            session: req.session,
            cookies: req.signedCookies,
        });
        res.status(401).send('Unauthorized: Please log in.');
    }
};

// EXAMPLE: Add a function to restrict access by role
// export const restrictTo = (role) => {
//     return async (req, res, next) => {
//         const userId = req.signedCookies.auth;
//         const user = await User.findById(userId);
//         if (user && user.role === role) {
//             next();
//         } else {
//             res.status(403).send('Forbidden');
//         }
//     };
// };
// Usage in server.js: app.get('/admin', isAuthenticated, restrictTo('admin'), (req, res) => {...});

// NOTES:
// - Enhance this with proper token validation if switching to JWT.
// - Add more middleware for specific permissions or roles.