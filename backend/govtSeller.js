import mongoose from 'mongoose';
import SellLand from './sellLand.js'; // Import SellLand model

// Define SellList schema (approved lands)
const SellListSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    location: { type: String, required: true },
    landType: { type: String, required: true },
    price: { type: Number, required: true },
    size: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
});

const SellList = mongoose.model('SellList', SellListSchema);

// Define DeclinedLand schema (declined lands)
const DeclinedLandSchema = new mongoose.Schema({
    sellLandId: { type: mongoose.Schema.Types.ObjectId, ref: 'SellLand', required: true },
    user: {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        name: { type: String, required: true },
        email: { type: String, required: true },
        phoneNumber: { type: String, required: true },
    },
    land: {
        landId: { type: mongoose.Schema.Types.ObjectId, ref: 'Land', required: true },
        title: { type: String, required: true },
        description: { type: String, required: true },
        location: {
            address: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
        },
        area: {
            value: { type: Number, required: true },
            unit: { type: String, required: true },
        },
        propertyType: { type: String, required: true },
        documentIds: { type: [String], required: true },
        saleDescription: { type: String },
        images: { type: [String], default: [] },
    },
    price: { type: Number, required: true },
    landImageUrl: { type: String },
    negotiable: { type: Boolean, default: false },
    contactPhoneNumber: { type: String },
});

const DeclinedLand = mongoose.model('DeclinedLand', DeclinedLandSchema);

// Get all sell land requests
export const getSellLands = async (req, res) => {
    try {
        const lands = await SellLand.find();
        res.status(200).json({ lands });
    } catch (error) {
        console.error('Get sell lands error:', error);
        res.status(500).json({ message: 'Server error fetching sell lands' });
    }
};

// Approve or decline a sell land request
export const updateSellLandStatus = async (req, res) => {
    const { landId, action } = req.params;
    try {
        const sellLand = await SellLand.findById(landId);
        if (!sellLand) {
            return res.status(404).json({ message: 'Sell land request not found' });
        }

        if (sellLand.status !== 'pending') {
            return res.status(400).json({ message: 'This request has already been processed' });
        }

        if (action === 'approve') {
            sellLand.status = 'approved';
            await sellLand.save();

            let maxId = await SellList.findOne().sort('-id').exec();
            const newId = maxId ? maxId.id + 1 : 1;

            const sellListEntry = {
                id: newId,
                title: sellLand.land.title,
                location: `${sellLand.land.location.city}, ${sellLand.land.location.state}`,
                landType: sellLand.land.propertyType,
                price: sellLand.price,
                size: sellLand.land.area.value,
                image: sellLand.landImageUrl || sellLand.land.images[0] || 'https://via.placeholder.com/150',
                description: sellLand.land.description,
            };
            await SellList.create(sellListEntry);

            res.status(200).json({ message: 'Land approved and added to sell list' });
        } else if (action === 'decline') {
            sellLand.status = 'declined';
            await sellLand.save();

            const declinedEntry = {
                sellLandId: sellLand._id,
                user: sellLand.user,
                land: sellLand.land,
                price: sellLand.price,
                landImageUrl: sellLand.landImageUrl,
                negotiable: sellLand.negotiable,
                contactPhoneNumber: sellLand.contactPhoneNumber,
            };
            await DeclinedLand.create(declinedEntry);

            res.status(200).json({ message: 'Land declined and added to declined list' });
        } else {
            return res.status(400).json({ message: 'Invalid action' });
        }
    } catch (error) {
        console.error('Update sell land status error:', error);
        res.status(500).json({ message: `Server error during ${action}` });
    }
};