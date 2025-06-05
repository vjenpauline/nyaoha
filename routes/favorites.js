const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

// function to load plants data from JSON file
async function loadPlants() {
  const data = await fs.readFile(path.join(__dirname, '..', 'public', 'api', 'plants.json'), 'utf-8');
  return JSON.parse(data);
}

// express route for managing user favorites
router.get('/', auth, async (req, res) => {
  try {
    // find the user by ID
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // load plants data
    const plants = await loadPlants();

    // filter the plants to get only the favorite ones
    const favoritePlants = plants.filter(plant => user.favorites.includes(plant.pid));

    // return the favorite plants as a response
    res.json(favoritePlants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// express route for adding or removing a plant from favorites
router.post('/:pid', auth, async (req, res) => {
  try {
    // find the user by ID
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const pid = req.params.pid;

    // check if the plant is already in favorites
    const index = user.favorites.indexOf(pid);
    if (index === -1) {
      // if not, add it to favorites
      user.favorites.push(pid);
    } else {
      // if yes, remove it from favorites
      user.favorites.splice(index, 1);
    }
    await user.save();

    // return the updated favorites list as a response
    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
