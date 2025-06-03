require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const Plant = require('./models/plant');
const Contact = require('./models/contact'); // Assuming the Contact model is defined separately in models/contact.js
// Initialize Express
const app = express();

// Configure CORS
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://nyaoha.onrender.com',
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(bodyParser.json()); // Added body-parser middleware for compatibility

// Serve static files
app.use(express.static(path.join(__dirname, 'initial code')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/pictures', express.static(path.join(__dirname, 'initial code/pictures')));
app.use('/stylescripts', express.static(path.join(__dirname, 'stylescripts')));
app.use('/javascripts', express.static(path.join(__dirname, 'javascripts')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Routes
app.use('/', require('./routes/static'));
app.use('/api/plants', require('./routes/plants'));
app.use('/api/user', require('./routes/user'));
app.use('/api/favorites', require('./routes/favorites'));
app.use('/api/contact', require('./routes/contact'));

// Import plants data from plantsm.art
async function importPlantsData() {
    try {
        const plantsData = await fs.readFile(path.join(__dirname, 'plantsm.art/static/api/plants.json'), 'utf8');
        const plants = JSON.parse(plantsData);

        for (const plant of plants) {
            await Plant.findOneAndUpdate(
                { name: plant.name },
                plant,
                { upsert: true, new: true }
            );
        }
        console.log('✅ Plants data imported successfully');
    } catch (error) {
        console.error('❌ Error importing plants data:', error);
    }
}

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Start the server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));