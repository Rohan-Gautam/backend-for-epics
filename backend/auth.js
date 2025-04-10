// auth.js
export const isAuthenticated = (req, res, next) => {
    if (req.signedCookies && req.signedCookies.auth) {
        // Cookie exists; assume valid for demo purposes
        next();
    } else {
        // No auth cookie; redirect to login
        res.redirect('/login');
    }
};
