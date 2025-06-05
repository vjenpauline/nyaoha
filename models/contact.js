// mongoose schema for contact form submissions
const mongoose = require('mongoose');

// define the contact schema
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true }, // name is required
    email: { type: String, required: true }, // email is required
    phone: { type: String }, 
    message: { type: String, required: true }, // message is required
    submittedAt: { type: Date, default: Date.now }, // submission date, defaults to now
});

// export the model
module.exports = mongoose.model('Contact', contactSchema);