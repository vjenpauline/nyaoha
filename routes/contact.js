const express = require('express');
const router = express.Router();
const Contact = require('../models/contact'); // Import the Contact model
const transporter = require('../config/nodemailer'); // Import the transporter

// Contact Form Endpoint
router.post('/api/contact', async (req, res) => {
    const { name, email, phone, message } = req.body;

    try {
        // Save the form data to MongoDB
        const contact = new Contact({ name, email, phone, message });
        await contact.save();

        // Define email options
        const mailOptions = {
            from: `"Nyaoha Contact Form" <${process.env.EMAIL}>`, // Sender email address
            to: process.env.RECIPIENT_EMAIL, // Recipient email address
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
        };

        // Send email using Nodemailer transporter
        await transporter.sendMail(mailOptions);

        res.status(200).send({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).send({ message: 'Failed to send message' });
    }
});

module.exports = router;