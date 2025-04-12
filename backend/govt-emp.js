// First, let's fix the govt-emp.js file to ensure it exports both the router and the model

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import express from 'express';

const router = express.Router();

// Define Govt Employee Schema
const govtEmpSchema = new mongoose.Schema({
    empId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: String, required: true },
    role: { type: String, required: true, enum: ['government'], default: 'government' },
});

const GovtEmployee = mongoose.model('GovtEmployee', govtEmpSchema);

// Register Government Employee
router.post('/govt-emp-register', async (req, res) => {
    const { empId, name, email, password, department } = req.body || {};

    // Validate request body
    if (!empId || !name || !email || !password || !department) {
        return res.status(400).json({ message: 'All fields are required: empId, name, email, password, department' });
    }

    try {
        const existingEmp = await GovtEmployee.findOne({ $or: [{ empId }, { email }] });
        if (existingEmp) {
            return res.status(400).json({ message: 'Employee ID or email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newEmp = new GovtEmployee({ empId, name, email, password: hashedPassword, department });

        await newEmp.save();
        res.status(201).json({ message: 'Government employee registered successfully' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Server error during registration' });
    }
});

// Login Government Employee
router.post('/govt-emp-login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const employee = await GovtEmployee.findOne({ email });
        if (!employee) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await bcrypt.compare(password, employee.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Invalid email or password' });
        }

        // Set session data
        req.session.userRole = 'government';
        
        // Set authentication cookie
        res.cookie('auth', employee._id.toString(), { 
            signed: true, 
            httpOnly: true, 
            maxAge: 24 * 60 * 60 * 1000 // 1 day expiry
        });

        // For debugging
        console.log('Login successful for employee:', employee._id.toString());

        res.status(200).json({ 
            message: 'Login successful', 
            name: employee.name,
            redirect: '/pages/Government/Govt-verification.html'
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Export both the router and the model
export { GovtEmployee };
export default router;