const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactSchema);