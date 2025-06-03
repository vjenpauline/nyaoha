const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');
const transporter = require('../config/nodemailer');

router.post('/', async (req, res) => {
    const { name, email, phone, message } = req.body;

    try {
        const contact = new Contact({ name, email, phone, message });
        await contact.save();

        const mailOptions = {
            from: `"Nyaoha Contact Form" <${process.env.EMAIL}>`,
            to: process.env.RECIPIENT_EMAIL,
            subject: `New Contact Form Submission from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
        };

        await transporter.sendMail(mailOptions);

        res.status(200).send({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).send({ message: 'Failed to send message' });
    }
});

module.exports = router;
