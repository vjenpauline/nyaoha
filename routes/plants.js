const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

router.get('/', async (req, res) => {
    try {
        const { query = '', animals = [], severity } = req.query;

        // Read and parse the plants JSON file
        const data = await fs.readFile(path.join(__dirname, '..', 'public', 'api', 'plants.json'), 'utf-8');
        let plants = JSON.parse(data);

        // Normalize animals query param to array if string
        const animalsArr = typeof animals === 'string' ? [animals] : animals;

        // Create case-insensitive RegExp for search query
        const searchRegex = new RegExp(query, 'i');

        // Filter plants in-memory based on query parameters
        plants = plants.filter(plant => {
            // Check name or common[0].name match
            const nameMatch = searchRegex.test(plant.name) ||
                              (plant.common && plant.common[0] && searchRegex.test(plant.common[0].name));

            if (!nameMatch) return false;

            // Check animals filter if any
            if (animalsArr.length > 0) {
                if (!plant.animals) return false;
                // All requested animals must be included in plant.animals
                const hasAllAnimals = animalsArr.every(animal => plant.animals.includes(animal));
                if (!hasAllAnimals) return false;
            }

            // Check severity filter if set
            if (severity) {
                if (!plant.severity || plant.severity.slug !== severity) return false;
            }

            return true;
        });

        // Optionally limit results to 200 (like MongoDB limit)
        plants = plants.slice(0, 200);

        res.json(plants);
    } catch (err) {
        console.error('Error reading plants.json:', err);
        res.status(500).json({ message: 'Error reading plant data' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const data = await fs.readFile(path.join(__dirname, '..', 'public', 'api', 'plants.json'), 'utf-8');
        const plants = JSON.parse(data);

        const plant = plants.find(p => p._id === req.params.id || p.id === req.params.id);

        if (!plant) return res.status(404).json({ message: 'Plant not found' });

        res.json(plant);
    } catch (err) {
        console.error('Error reading plants.json:', err);
        res.status(500).json({ message: 'Error getting plant' });
    }
});

module.exports = router;
