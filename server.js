// server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/user');
const Plant = require('./models/plant');
const auth = require('./middleware/auth');
const cors = require('cors');
const path = require('path');
const { body, validationResult } = require('express-validator');

const app = express();
// Configure CORS to accept requests from your deployed frontend and localhost
app.use(cors({
    origin: [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'https://your-frontend-url.onrender.com', // Replace with your actual frontend URL
        'http://localhost:3000'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware to parse JSON bodies
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Serve static files
app.use(express.static(path.join(__dirname, 'initial code')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/pictures', express.static(path.join(__dirname, 'initial code/pictures')));
app.use('/stylescripts', express.static(path.join(__dirname, 'stylescripts')));
app.use('/javascripts', express.static(path.join(__dirname, 'javascripts')));

// Plant Database API Routes
app.get('/api/plants.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'api', 'plants.json'));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => console.error('❌ MongoDB connection error:', err));

// Route handlers
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'initial code', '1-index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'initial code', 'log-in.html'));
});

app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'initial code', 'sign-up.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, 'initial code', 'profile.html'));
});

// API Routes
// Signup route with validation
app.post('/signup', [
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { firstName, lastName, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      firstName,
      lastName,
      email,
      password: hashedPassword,
    });    await newUser.save();
    
    // Generate JWT token for new user
    const token = jwt.sign(
      { userId: newUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      message: 'Account created successfully',
      token,
      user: {
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login route with validation
app.post('/login', [
  body('email').isEmail().withMessage('Invalid email format'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ 
      message: 'Login successful',
      token,
      user: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Plant Database Routes
app.get('/api/plants', async (req, res) => {
  try {
    const plants = await Plant.find({});
    res.json(plants);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plants' });
  }
});

app.get('/api/plants/:id', async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.id);
    if (!plant) {
      return res.status(404).json({ message: 'Plant not found' });
    }
    res.json(plant);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching plant' });
  }
});

app.get('/api/plants/search', async (req, res) => {
  try {
    const { query, toxicTo } = req.query;
    let searchQuery = {};
    
    if (query) {
      searchQuery.$or = [
        { name: new RegExp(query, 'i') },
        { scientificName: new RegExp(query, 'i') }
      ];
    }
    
    if (toxicTo) {
      searchQuery['toxicity.toxicTo'] = toxicTo;
    }
    
    const plants = await Plant.find(searchQuery);
    res.json(plants);
  } catch (error) {
    res.status(500).json({ message: 'Error searching plants' });
  }
});

// Protected routes example
app.get('/api/user/garden', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ garden: user.garden });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user garden' });
  }
});

// Import plants data from plantsm.art
const fs = require('fs').promises;

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
