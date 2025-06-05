const express = require('express');
const router = express.Router();
const User = require('../models/user');
const auth = require('../middleware/auth');
const fs = require('fs').promises;
const path = require('path');

async function loadPlants() {
  const data = await fs.readFile(path.join(__dirname, '..', 'public', 'api', 'plants.json'), 'utf-8');
  return JSON.parse(data);
}

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const plants = await loadPlants();

    const favoritePlants = plants.filter(plant => user.favorites.includes(plant.pid));

    res.json(favoritePlants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/:pid', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const pid = req.params.pid;

    const index = user.favorites.indexOf(pid);
    if (index === -1) {
      user.favorites.push(pid);
    } else {
      user.favorites.splice(index, 1);
    }
    await user.save();

    res.json({ success: true, favorites: user.favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
