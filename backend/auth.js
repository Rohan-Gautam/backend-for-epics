// Middleware to check if user is authenticated
export const isAuthenticated = (req, res, next) => {
    if (req.signedCookies && req.signedCookies.auth) {
        // Cookie exists; assume valid for demo purposes
        next();
    } else {
        // No auth cookie; redirect to login
        res.redirect('/login');
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