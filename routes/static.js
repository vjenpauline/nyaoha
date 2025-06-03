const express = require('express');
const path = require('path');

const router = express.Router();

router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../initial code', '1-index.html'));
});

router.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../initial code', 'log-in.html'));
});

router.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, '../initial code', 'sign-up.html'));
});

router.get('/profile', (req, res) => {
    res.sendFile(path.join(__dirname, '../initial code', 'profile.html'));
});

module.exports = router;