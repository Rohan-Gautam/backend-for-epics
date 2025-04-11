import GovtEmployee from './govt-emp.js'; // Import the GovtEmployee model

// Middleware to check if government employee is authenticated
export const isGovtAuthenticated = (req, res, next) => {
    if (req.signedCookies && req.signedCookies.auth) {
        // Cookie exists; assume valid for demo purposes
        next();
    } else {
        // No auth cookie; redirect to government login
        res.redirect('/pages/Government/Govt-login.html');
    }
};

// Middleware to restrict access to government employees only
export const restrictToGovernment = async (req, res, next) => {
    const employeeId = req.signedCookies.auth;
    try {
        const employee = await GovtEmployee.findById(employeeId);
        if (employee && employee.role === 'government') {
            next();
        } else {
            res.status(403).send('Forbidden: Access restricted to government employees');
        }
    } catch (error) {
        console.error('Error during role verification:', error);
        res.status(500).send('Server error during role verification');
    }
};