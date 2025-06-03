const express = require('express');
const router = express.Router();
const Plant = require('../models/plant');

router.get('/', async (req, res) => {
    try {
        const { query = '', animals = [], severity } = req.query;

        const searchRegex = new RegExp(query, 'i');
        const filter = {
            $and: [
                { $or: [{ name: searchRegex }, { "common.0.name": searchRegex }] },
            ]
        };

        if (animals.length) {
            filter.$and.push({ animals: { $all: animals } });
        }

        if (severity) {
            filter.$and.push({ "severity.slug": severity });
        }

        const plants = await Plant.find(filter).limit(200); // You can paginate later
        res.json(plants);
    } catch (err) {
        console.error('Error fetching plants:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const plant = await Plant.findById(req.params.id);
        if (!plant) return res.status(404).json({ message: 'Plant not found' });
        res.json(plant);
    } catch (err) {
        res.status(500).json({ message: 'Error getting plant' });
    }
});

module.exports = router;
