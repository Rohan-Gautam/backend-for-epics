import User from './register.js';
import Land from './models/land.js';
import upload from './middleware/multer.js';

export const registerLand = async (req, res) => {
    try {
        const userId = req.session.userId;
        if (!userId) {
            console.error('No userId in session:', req.session);
            return res.status(401).send('Unauthorized: Please log in.');
        }

        // Fetch user data to include with land registration
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User not found.');
        }

        const { landArea, landLocation } = req.body;
        const files = req.files;

        // Validate required fields
        if (!landArea || !landLocation || !files.landImage || !files.landDoc) {
            console.error('Missing fields:', { landArea, landLocation, landImage: !!files.landImage, landDoc: !!files.landDoc });
            return res.status(400).send('Missing required fields: land area, location, image, and ownership document.');
        }

        // Create land record
        const land = new Land({
            userId,
            landArea: parseFloat(landArea),
            landLocation,
            landImage: files.landImage[0].path,
            landDoc: files.landDoc[0].path,
            aadhaarDoc: files.aadhaarDoc ? files.aadhaarDoc[0].path : undefined,
            panDoc: files.panDoc ? files.panDoc[0].path : undefined,
            // Include user details
            ownerName: User.name,
            ownerAadhaarNumber: User.aadhaarNumber,
            ownerPanNumber: User.panNumber,
            ownerPhoneNumber: User.phoneNumber,
            ownerAddress: {
                line1: User.address.line1,
                city: User.address.city,
                state: User.address.state,
                pincode: User.address.pincode,
        }});

        await land.save();
        console.log('Land registered for userId:', userId);
        res.redirect('/home');
    } catch (error) {
        console.error('Land registration error:', error);
        res.status(500).send('Server error during land registration.');
    }
};

// Apply multer middleware
export const registerLandWithUpload = [
    upload.fields([
        { name: 'landImage', maxCount: 1 },
        { name: 'landDoc', maxCount: 1 },
        { name: 'aadhaarDoc', maxCount: 1 },
        { name: 'panDoc', maxCount: 1 },
    ]),
    registerLand,
];