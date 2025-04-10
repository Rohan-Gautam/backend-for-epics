const express = require('express');
const cors = require('cors');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Land data (in a real app, this would come from a database)
const landsData = [
  {
    "id": 1,
    "title": "Green Acres Farm",
    "location": "Jaipur",
    "price": 250000,
    "size": "2 acres",
    "type": "Agricultural",
    "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&h=300"
  },
  {
    "id": 2,
    "title": "Seaside Plot",
    "location": "Mumbai",
    "price": 750000,
    "size": "0.5 acres",
    "type": "Residential",
    "image": "https://images.unsplash.com/photo-1621502863666-96d34b16e89d?w=500&h=300"
  },
  {
    "id": 3,
    "title": "Mountain View Estate",
    "location": "Shimla",
    "price": 450000,
    "size": "1.5 acres",
    "type": "Residential",
    "image": "https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=500&h=300"
  },
  {
    "id": 4,
    "title": "Urban Development Plot",
    "location": "Delhi",
    "price": 1200000,
    "size": "0.75 acres",
    "type": "Commercial",
    "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=300"
  },
  {
    "id": 5,
    "title": "Riverside Property",
    "location": "Varanasi",
    "price": 320000,
    "size": "1 acre",
    "type": "Mixed-Use",
    "image": "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=500&h=300"
  },
  {
    "id": 6,
    "title": "Fertile Farmland",
    "location": "Punjab",
    "price": 175000,
    "size": "5 acres",
    "type": "Agricultural",
    "image": "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=500&h=300"
  },
  {
    "id": 7,
    "title": "Desert Oasis",
    "location": "Jaisalmer",
    "price": 120000,
    "size": "3 acres",
    "type": "Agricultural",
    "image": "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=500&h=300"
  },
  {
    "id": 8,
    "title": "City Center Plot",
    "location": "Bangalore",
    "price": 950000,
    "size": "0.25 acres",
    "type": "Commercial",
    "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=300"
  },
  {
    "id": 9,
    "title": "Tea Garden Estate",
    "location": "Darjeeling",
    "price": 550000,
    "size": "4 acres",
    "type": "Agricultural",
    "image": "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=500&h=300"
  },
  {
    "id": 10,
    "title": "Beachfront Property",
    "location": "Goa",
    "price": 1500000,
    "size": "1 acre",
    "type": "Residential",
    "image": "https://images.unsplash.com/photo-1621502863666-96d34b16e89d?w=500&h=300"
  },
  {
    "id": 11,
    "title": "Hillside Retreat",
    "location": "Ooty",
    "price": 480000,
    "size": "1.2 acres",
    "type": "Residential",
    "image": "https://images.unsplash.com/photo-1585543805890-6051f7829f98?w=500&h=300"
  },
  {
    "id": 12,
    "title": "Industrial Zone Plot",
    "location": "Pune",
    "price": 620000,
    "size": "2.5 acres",
    "type": "Industrial",
    "image": "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=500&h=300"
  }
];

// API endpoint to get all lands or filtered lands
app.get('/api/lands', (req, res) => {
  const { q, location, type, minPrice, maxPrice, minSize, maxSize } = req.query;
  
  let filteredLands = [...landsData];
  
  // Search functionality
  if (q) {
    const searchTerm = q.toLowerCase();
    filteredLands = filteredLands.filter(land => 
      land.title.toLowerCase().includes(searchTerm) || 
      land.location.toLowerCase().includes(searchTerm) ||
      land.type.toLowerCase().includes(searchTerm)
    );
  }
  
  // Filter by location
  if (location) {
    filteredLands = filteredLands.filter(land => 
      land.location.toLowerCase() === location.toLowerCase()
    );
  }
  
  // Filter by land type
  if (type) {
    filteredLands = filteredLands.filter(land => 
      land.type.toLowerCase() === type.toLowerCase()
    );
  }
  
  // Filter by price range
  if (minPrice) {
    filteredLands = filteredLands.filter(land => land.price >= parseInt(minPrice));
  }
  
  if (maxPrice) {
    filteredLands = filteredLands.filter(land => land.price <= parseInt(maxPrice));
  }
  
  // Filter by size (this is a simplification as size is stored as string like "2 acres")
  if (minSize || maxSize) {
    filteredLands = filteredLands.filter(land => {
      // Extract numeric part from size string
      const sizeValue = parseFloat(land.size.split(' ')[0]);
      
      if (minSize && maxSize) {
        return sizeValue >= parseFloat(minSize) && sizeValue <= parseFloat(maxSize);
      } else if (minSize) {
        return sizeValue >= parseFloat(minSize);
      } else if (maxSize) {
        return sizeValue <= parseFloat(maxSize);
      }
      return true;
    });
  }
  
  res.json(filteredLands);
});

// Get land by ID
app.get('/api/lands/:id', (req, res) => {
  const land = landsData.find(land => land.id === parseInt(req.params.id));
  if (!land) {
    return res.status(404).json({ message: 'Land not found' });
  }
  res.json(land);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;