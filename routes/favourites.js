// routes/favorites.js
const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Plant = require('../models/plant');
const auth = require('../middleware/auth'); // JWT auth middleware

// Get user's favorites
router.get('/', auth, async (req, res) => {
  const user = await User.findById(req.user.id).populate('favorites');
  res.json(user.favorites);
});

// Toggle favorite
router.post('/:plantId', auth, async (req, res) => {
  const user = await User.findById(req.user.id);
  const plantId = req.params.plantId;

  const index = user.favorites.indexOf(plantId);
  if (index === -1) {
    user.favorites.push(plantId);
  } else {
    user.favorites.splice(index, 1);
  }
  await user.save();
  res.json({ success: true, favorites: user.favorites });
});

module.exports = router;
