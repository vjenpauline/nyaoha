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

    // ✅ DEBUG: Log env vars before sending email
    console.log('EMAIL:', process.env.EMAIL);
    console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Exists' : 'Missing');
    console.log('RECIPIENT_EMAIL:', email);

    const mailOptions = {
    from: `"Nyaoha Team" <${process.env.EMAIL}>`,
    to: email, // send to user's email
    subject: `Thanks for contacting us!`,
    text: `Hi ${name},\n\nThanks for reaching out. We'll get back to you shortly.\n\nBest,\nThe 'nyaoha' Team`,
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
