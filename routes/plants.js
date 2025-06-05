const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

// express route for plant data
router.get('/', async (req, res) => {
    try {
        // extract query parameters
        const { query = '', animals = [], severity } = req.query;

        // read and parse plants data file
        const data = await fs.readFile(path.join(__dirname, '..', 'public', 'api', 'plants.json'), 'utf-8');
        let plants = JSON.parse(data);

        // ensure animals is an array
        const animalsArr = typeof animals === 'string' ? [animals] : animals;

        // create a regex for case-insensitive search
        const searchRegex = new RegExp(query, 'i');

        // filter plants based on search criteria
        plants = plants.filter(plant => {
            // check if plant name or common name matches the query
            const nameMatch = searchRegex.test(plant.name) ||
                              (plant.common && plant.common[0] && searchRegex.test(plant.common[0].name));

            if (!nameMatch) return false;
            // if animals are specified, check if plant is suitable for all those animals
            if (animalsArr.length > 0) {
                if (!plant.animals) return false;
                const hasAllAnimals = animalsArr.every(animal => plant.animals.includes(animal));
                if (!hasAllAnimals) return false;
            }

            // if severity is specified, check if it matches the plant's severity
            if (severity) {
                if (!plant.severity || plant.severity.slug !== severity) return false;
            }

            return true;
        });

        // limit the number of results
        plants = plants.slice(0, 200);

        // send the filtered plants as a response
        res.json(plants);
    } catch (err) {
        console.error('Error reading plants.json:', err);
        res.status(500).json({ message: 'Error reading plant data' });
    }
});

// express route for a single plant detail
router.get('/:id', async (req, res) => {
    try {
        // read and parse plants data file
        const data = await fs.readFile(path.join(__dirname, '..', 'public', 'api', 'plants.json'), 'utf-8');
        const plants = JSON.parse(data);

        // find the plant by id
        const plant = plants.find(p => p._id === req.params.id || p.id === req.params.id);

        // if plant not found, send 404 response
        if (!plant) return res.status(404).json({ message: 'Plant not found' });

        // send the plant details as a response
        res.json(plant);
    } catch (err) {
        console.error('Error reading plants.json:', err);
        res.status(500).json({ message: 'Error getting plant' });
    }
});

module.exports = router;
