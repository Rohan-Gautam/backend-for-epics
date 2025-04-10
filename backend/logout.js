export const logoutUser = (req, res) => {
    // Destroy the session
    req.session.destroy((err) => {
        if (err) {
            console.error('Error destroying session:', err);
            return res.status(500).json({ message: 'Logout failed' });
        }

        // Clear the 'auth' cookie set during login
        res.clearCookie('auth', { signed: true, httpOnly: true });

        // Redirect to login page
        res.redirect('/login');
    });
};