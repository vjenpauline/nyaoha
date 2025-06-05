const nodemailer = require('nodemailer');
require('dotenv').config();

// setup nodemailer transporter for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.EMAIL_PASSWORD,
    },
});

module.exports = transporter;