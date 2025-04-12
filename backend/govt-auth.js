// Fix the import to correctly import the GovtEmployee model
import { GovtEmployee } from './govt-emp.js';

// Middleware to check if government employee is authenticated
export const isGovtAuthenticated = (req, res, next) => {
    if (req.signedCookies && req.signedCookies.auth) {
        // Cookie exists; assume valid for demo purposes
        console.log('Auth cookie found:', req.signedCookies.auth);
        next();
    } else {
        // No auth cookie; redirect to government login
        console.log('No auth cookie found, redirecting to login');
        res.redirect('/pages/Government/Govt-login.html');
    }
};

// Middleware to restrict access to government employees only
export const restrictToGovernment = async (req, res, next) => {
    const employeeId = req.signedCookies.auth;
    console.log('Checking government role for employee ID:', employeeId);
    
    // Check if session has government role (as a backup)
    if (req.session && req.session.userRole === 'government') {
        console.log('Session has government role, access granted');
        return next();
    }
    
    try {
        const employee = await GovtEmployee.findById(employeeId);
        console.log('Employee found:', employee ? 'Yes' : 'No');
        
        if (employee && employee.role === 'government') {
            // Set the role in session for future checks
            req.session.userRole = 'government';
            console.log('Employee has government role, access granted');
            next();
        } else {
            console.log('Access denied: not a government employee');
            res.status(403).send('Forbidden: Access restricted to government employees');
        }
    } catch (error) {
        console.error('Error during role verification:', error);
        res.status(500).send('Server error during role verification');
    }
};