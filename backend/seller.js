// seller.js - Backend script for handling land selling functionality
import express from 'express';
import mongoose from 'mongoose';
import { isAuthenticated } from './auth.js';


const router = express.Router();

// Define Land Schema
const landSchema = new mongoose.Schema({
    owner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    location: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        pincode: { type: String, required: true, match: /^\d{6}$/ }
    },
    area: {
        value: { type: Number, required: true },
        unit: { type: String, required: true, enum: ['sqft', 'sqm', 'acre', 'hectare'] }
    },
    propertyType: { 
        type: String, 
        required: true, 
        enum: ['residential', 'commercial', 'agricultural', 'industrial'] 
    },
    documentIds: [{
        type: String,
        required: true
    }],
    registrationDate: { 
        type: Date, 
        default: Date.now 
    },
    status: { 
        type: String, 
        required: true, 
        enum: ['available', 'pending', 'sold'], 
        default: 'available' 
    },
    price: { 
        type: Number, 
        required: function() { return this.status === 'pending'; }
    },
    saleDescription: { 
        type: String 
    },
    negotiable: { 
        type: Boolean, 
        default: false 
    },
    statistics: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        inquiries: { type: Number, default: 0 }
    },
    images: [{ 
        type: String 
    }]
});

const Land = mongoose.model('Land', landSchema);

// GET user's lands
router.get('/api/lands', isAuthenticated, async (req, res) => {
    try {
        const userId = req.signedCookies.auth || req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }

        // Convert to ObjectId
        const ownerId = new mongoose.Types.ObjectId(userId);
        
        // Get filter parameters
        const { status, sort } = req.query;
        
        // Build query
        const query = { owner: ownerId };
        
        // Add status filter if provided
        if (status && status !== 'all') {
            query.status = status;
        }
        
        // Build sort options
        let sortOptions = {};
        
        switch (sort) {
            case 'oldest':
                sortOptions = { registrationDate: 1 };
                break;
            case 'views':
                sortOptions = { 'statistics.views': -1 };
                break;
            case 'likes':
                sortOptions = { 'statistics.likes': -1 };
                break;
            case 'newest':
            default:
                sortOptions = { registrationDate: -1 };
        }
        
        const lands = await Land.find(query)
            .sort(sortOptions)
            .populate('owner', 'name username') // Populate owner details
            .exec();
            
        res.json(lands);
    } catch (error) {
        console.error('Error fetching lands:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PUT update land status to for sale
router.put('/api/lands/:id/sell', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { price, description, negotiable } = req.body;
        const userId = req.signedCookies.auth || req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        // Verify the user owns this land
        const land = await Land.findOne({ _id: id, owner: userId });
        
        if (!land) {
            return res.status(403).json({ message: 'Land not found or you do not have permission' });
        }
        
        // Update land status to pending (for sale)
        land.status = 'pending';
        land.price = price;
        land.saleDescription = description;
        land.negotiable = negotiable || false;
        
        await land.save();
        
        res.json({ message: 'Land listed for sale successfully', land });
    } catch (error) {
        console.error('Error listing land for sale:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET user profile information
router.get('/api/user', isAuthenticated, async (req, res) => {
    try {
        const userId = req.signedCookies.auth || req.session.userId;
        
        if (!userId) {
            return res.status(401).json({ message: 'Not authenticated' });
        }
        
        const User = mongoose.model('User');
        const user = await User.findById(userId).select('name username email');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json(user);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Update land statistics (for example, increment views)
router.put('/api/lands/:id/stats', isAuthenticated, async (req, res) => {
    try {
        const { id } = req.params;
        const { field } = req.body; // field can be 'views', 'likes', or 'inquiries'
        
        if (!['views', 'likes', 'inquiries'].includes(field)) {
            return res.status(400).json({ message: 'Invalid statistic field' });
        }
        
        const updateField = `statistics.${field}`;
        const land = await Land.findByIdAndUpdate(
            id,
            { $inc: { [updateField]: 1 } },
            { new: true }
        );
        
        if (!land) {
            return res.status(404).json({ message: 'Land not found' });
        }
        
        res.json({ message: `Land ${field} updated`, statistics: land.statistics });
    } catch (error) {
        console.error(`Error updating land statistics:`, error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create frontend JavaScript for the seller page
const createFrontendJS = () => {
    return `// Frontend JavaScript for seller.html

document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const landsContainer = document.getElementById('lands-container');
    const loadingSpinner = document.getElementById('loading-spinner');
    const emptyState = document.getElementById('empty-state');
    const statusFilter = document.getElementById('statusFilter');
    const sortBy = document.getElementById('sortBy');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const sellLandModal = new bootstrap.Modal(document.getElementById('sellLandModal'));
    const sellLandForm = document.getElementById('sellLandForm');
    const confirmSellBtn = document.getElementById('confirmSellBtn');
    const usernameDisplay = document.getElementById('username-display');
    
    // Current filters
    let currentFilters = {
        status: 'all',
        sort: 'newest'
    };
    
    // Fetch user profile
    function fetchUserProfile() {
        fetch('/api/user')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }
                return response.json();
            })
            .then(user => {
                usernameDisplay.textContent = user.username;
            })
            .catch(error => {
                console.error('Error fetching user profile:', error);
            });
    }
    
    // Fetch lands with filters
    function fetchLands() {
        loadingSpinner.classList.remove('d-none');
        landsContainer.innerHTML = '';
        emptyState.classList.add('d-none');
        
        const queryParams = new URLSearchParams({
            status: currentFilters.status,
            sort: currentFilters.sort
        });
        
        fetch('/api/lands?' + queryParams.toString())
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch lands');
                }
                return response.json();
            })
            .then(lands => {
                loadingSpinner.classList.add('d-none');
                
                if (lands.length === 0) {
                    emptyState.classList.remove('d-none');
                    return;
                }
                
                renderLands(lands);
            })
            .catch(error => {
                console.error('Error fetching lands:', error);
                loadingSpinner.classList.add('d-none');
                landsContainer.innerHTML = \`
                    <div class="col-12 text-center">
                        <div class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle"></i> Error loading lands. Please try again.
                        </div>
                    </div>
                \`;
            });
    }
    
    // Render lands to the container
    function renderLands(lands) {
        landsContainer.innerHTML = '';
        
        lands.forEach(land => {
            // Default image if none provided
            const imageSrc = land.images && land.images.length > 0 
                ? land.images[0] 
                : '/assets/images/default-land.jpg';
            
            // Format land area with unit
            const formattedArea = \`\${land.area.value} \${land.area.unit}\`;
            
            // Format registration date
            const regDate = new Date(land.registrationDate);
            const formattedDate = regDate.toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            });
            
            // Status badge class
            let statusClass = '';
            let statusText = '';
            
            switch (land.status) {
                case 'available':
                    statusClass = 'status-available';
                    statusText = 'Available';
                    break;
                case 'pending':
                    statusClass = 'status-pending';
                    statusText = 'For Sale';
                    break;
                case 'sold':
                    statusClass = 'status-sold';
                    statusText = 'Sold';
                    break;
            }
            
            // Create land card
            const landCard = document.createElement('div');
            landCard.className = 'col-md-6 col-lg-4';
            landCard.innerHTML = \`
                <div class="card land-card">
                    <div class="land-status \${statusClass}">\${statusText}</div>
                    <img src="\${imageSrc}" class="card-img-top land-image" alt="\${land.title}">
                    <div class="card-body">
                        <h5 class="card-title">\${land.title}</h5>
                        <p class="card-text text-truncate">\${land.description}</p>
                        
                        <div class="d-flex justify-content-between align-items-center mb-2">
                            <div>
                                <span class="badge bg-secondary stats-badge badge-views">
                                    <i class="fas fa-eye"></i> \${land.statistics.views} views
                                </span>
                                <span class="badge bg-danger stats-badge badge-likes">
                                    <i class="fas fa-heart"></i> \${land.statistics.likes} likes
                                </span>
                                <span class="badge bg-success stats-badge badge-inquiries">
                                    <i class="fas fa-comment"></i> \${land.statistics.inquiries} inquiries
                                </span>
                            </div>
                        </div>
                        
                        <ul class="list-group list-group-flush mb-3">
                            <li class="list-group-item"><i class="fas fa-map-marker-alt"></i> \${land.location.city}, \${land.location.state}</li>
                            <li class="list-group-item"><i class="fas fa-ruler-combined"></i> \${formattedArea}</li>
                            <li class="list-group-item"><i class="fas fa-calendar-alt"></i> Registered on \${formattedDate}</li>
                            \${land.price ? \`<li class="list-group-item"><i class="fas fa-tag"></i> Listed at ₹\${land.price.toLocaleString('en-IN')}\${land.negotiable ? ' (Negotiable)' : ''}</li>\` : ''}
                        </ul>
                        
                        <div class="d-grid gap-2">
                            \${land.status === 'available' ? 
                                \`<button class="btn btn-primary sell-btn" data-land-id="\${land._id}" data-land-title="\${land.title}">
                                    <i class="fas fa-rupee-sign"></i> List for Sale
                                </button>\` : 
                                \`<button class="btn btn-secondary" disabled>
                                    \${land.status === 'pending' ? '<i class="fas fa-hourglass-half"></i> Listed for Sale' : '<i class="fas fa-check-circle"></i> Sold'}
                                </button>\`
                            }
                            <a href="/land-details/\${land._id}" class="btn btn-outline-primary">
                                <i class="fas fa-info-circle"></i> View Details
                            </a>
                        </div>
                    </div>
                </div>
            \`;
            
            landsContainer.appendChild(landCard);
        });
        
        // Add event listeners to sell buttons
        document.querySelectorAll('.sell-btn').forEach(button => {
            button.addEventListener('click', function() {
                const landId = this.getAttribute('data-land-id');
                const landTitle = this.getAttribute('data-land-title');
                
                // Set land ID in the form
                document.getElementById('landId').value = landId;
                document.getElementById('sellLandModalLabel').textContent = \`Sell: \${landTitle}\`;
                
                // Show the modal
                sellLandModal.show();
            });
        });
    }
    
    // Apply filters
    applyFiltersBtn.addEventListener('click', function() {
        currentFilters.status = statusFilter.value;
        currentFilters.sort = sortBy.value;
        fetchLands();
    });
    
    // Handle sell land form submission
    confirmSellBtn.addEventListener('click', function() {
        const landId = document.getElementById('landId').value;
        const price = document.getElementById('askingPrice').value;
        const description = document.getElementById('description').value;
        const negotiable = document.getElementById('negotiable').checked;
        
        if (!price) {
            alert('Please enter an asking price');
            return;
        }
        
        // Send request to list land for sale
        fetch(\`/api/lands/\${landId}/sell\`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                price: Number(price),
                description,
                negotiable
            })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to list land for sale');
            }
            return response.json();
        })
        .then(data => {
            sellLandModal.hide();
            alert('Land successfully listed for sale!');
            fetchLands(); // Refresh lands list
        })
        .catch(error => {
            console.error('Error listing land for sale:', error);
            alert('Failed to list land for sale. Please try again.');
        });
    });
    
    // Initialize
    fetchUserProfile();
    fetchLands();
});
`;
}

// Create the client-side JavaScript file
const clientJS = createFrontendJS();

// Export the router for use in the main server file
export default {
    router,
    clientJS
};