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
app.use(cors({
    origin: '*', // Allow all origins in production
    credentials: true
}));
app.use(express.json());

// Log all incoming requests for debugging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Serve static files
app.use(express.static(path.join(__dirname, 'initial code')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use('/pictures', express.static(path.join(__dirname, 'initial code/pictures')));
app.use('/stylescripts', express.static(path.join(__dirname, 'stylescripts')));
app.use('/javascripts', express.static(path.join(__dirname, 'javascripts')));

console.log('Attempting to connect to MongoDB with URI:', process.env.MONGO_URI);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    // Test the connection by counting users
    return User.countDocuments();
  })
  .then(count => {
    console.log(`Current number of users in database: ${count}`);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    console.error('Error details:', JSON.stringify(err, null, 2));
  });

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
  console.log('Received signup request:', {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    hasPassword: !!req.body.password
  });
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

// Health check endpoint - place this near the top of your routes
app.get('/status', async (req, res) => {
  try {
    // Check MongoDB connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Basic connection test
    const userCount = await User.estimatedDocumentCount();
    
    res.json({
      timestamp: new Date().toISOString(),
      status: 'ok',
      service: 'nyaoha-api',
      mongodb: {
        status: dbStatus,
        userCount,
      },
      env: {
        nodeEnv: process.env.NODE_ENV || 'not set',
        port: PORT,
        mongoConnected: mongoose.connection.readyState === 1
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      timestamp: new Date().toISOString(),
      status: 'error',
      service: 'nyaoha-api',
      error: {
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      }
    });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
