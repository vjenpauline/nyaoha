const express = require('express');
const Plant = require('../models/plant');

const router = express.Router();

// Get all plants
router.get('/', async (req, res) => {
    try {
        const plants = await Plant.find({});
        res.json(plants);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching plants' });
    }
});

// Get plant by ID
router.get('/:id', async (req, res) => {
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

// Search plants
router.get('/search', async (req, res) => {
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

module.exports = router;