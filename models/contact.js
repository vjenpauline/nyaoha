const mongoose = require('mongoose');

// Define a schema for contact form submissions
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
});

// Create and export the model for contact submissions
module.exports = mongoose.model('Contact', contactSchema);