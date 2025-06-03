const nodemailer = require('nodemailer');
require('dotenv').config();

// Configure Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail', // Use 'gmail' or another email provider
    auth: {
        user: process.env.EMAIL, // Your email from environment variables
        pass: process.env.EMAIL_PASSWORD, // Your email password or app password
    },
});

// Export the transporter for reuse
module.exports = transporter;