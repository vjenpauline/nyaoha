const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');
const transporter = require('../config/nodemailer');

router.post('/', async (req, res) => {
    const { name, email, phone, message } = req.body;

        // ✅ Basic validation
    if (!name || !email || !phone || !message) {
        return res.status(400).send({ message: 'Please fill all the required fields.' });
    }

    try {
    const contact = new Contact({ name, email, phone, message });
    await contact.save();

    const mailOptions = {
        from: `"Nyaoha Contact Form" <${process.env.EMAIL}>`,
        to: process.env.RECIPIENT_EMAIL,
        subject: `New Contact Form Submission from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone}\nMessage: ${message}`,
    };

    const result = await transporter.sendMail(mailOptions);  // 🔍
    console.log('Mail sent result:', result);               // ✅ Add this

    res.status(200).send({ message: 'Message sent successfully!' });
    } catch (error) {
    console.error('Error processing contact form:', error);  // ✅ Already helpful
    res.status(500).send({ message: 'Failed to send message', error: error.message });
    }
});

module.exports = router;
