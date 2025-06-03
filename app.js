const express = require('express');
const app = express();

const userRoutes = require('./routes/user');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(userRoutes);

module.exports = app;
