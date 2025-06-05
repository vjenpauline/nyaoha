const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

router.get('/', async (req, res) => {
    try {
        const { query = '', animals = [], severity } = req.query;

        const data = await fs.readFile(path.join(__dirname, '..', 'public', 'api', 'plants.json'), 'utf-8');
        let plants = JSON.parse(data);

        const animalsArr = typeof animals === 'string' ? [animals] : animals;

        const searchRegex = new RegExp(query, 'i');

        plants = plants.filter(plant => {
            const nameMatch = searchRegex.test(plant.name) ||
                              (plant.common && plant.common[0] && searchRegex.test(plant.common[0].name));

            if (!nameMatch) return false;
            if (animalsArr.length > 0) {
                if (!plant.animals) return false;
                const hasAllAnimals = animalsArr.every(animal => plant.animals.includes(animal));
                if (!hasAllAnimals) return false;
            }

            if (severity) {
                if (!plant.severity || plant.severity.slug !== severity) return false;
            }

            return true;
        });

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
