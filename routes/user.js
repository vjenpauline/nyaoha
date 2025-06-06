const express = require('express');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('../middleware/auth');
const transporter = require('../config/nodemailer');
const Verification = require('../models/verification');
const crypto = require('crypto');

const router = express.Router();

// express route for user authentication and profile actions

router.post('/signup', [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { firstName, lastName, email, password } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        const token = jwt.sign(
            { userId: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ 
            message: 'Account created successfully',
            token,
            user: {
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.post('/login', [
    body('email').isEmail().withMessage('Invalid email format'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ 
            message: 'Login successful',
            token,
            user: {
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('firstName lastName email emailVerified favorites photo');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Failed to retrieve user' });
  }
});

router.post('/change-password', auth, async (req, res) => {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current and new password required.' });
    }
    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect.' });
        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();
        res.json({ message: 'Password changed successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to change password.' });
    }
});

router.post('/delete-account', auth, async (req, res) => {
    const userId = req.user.id;
    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ message: 'Account deleted successfully.' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to delete account.' });
    }
});

router.post('/update', auth, async (req, res) => {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let updateFields = { firstName, lastName };
        if (email && email !== user.email) {
            updateFields.email = email;
            updateFields.emailVerified = false;
        }
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true }
        );
        res.json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Failed to update user' });
    }
});

router.post('/send-verification-email', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const existing = await Verification.findOne({
      userId: user._id,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    if (existing) {
      return res.status(429).json({ message: 'A verification code was already sent. Please check your email or try again later.' });
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await Verification.create({ userId: user._id, code, expiresAt });

    await transporter.sendMail({
      from: `Nyaoha <${process.env.EMAIL}>`,
      to: user.email,
      subject: 'Your Nyaoha Verification Code',
      text: `Your verification code is: ${code}\nThis code will expire in 15 minutes.`
    });
    res.json({ message: 'Verification email sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to send verification email.' });
  }
});

router.post('/verify-email', auth, async (req, res) => {
  const { code } = req.body;
  try {
    const verification = await Verification.findOne({
      userId: req.user.id,
      code,
      used: false,
      expiresAt: { $gt: new Date() }
    });
    if (!verification) return res.status(400).json({ message: 'Invalid or expired code.' });
    verification.used = true;
    await verification.save();
    await User.findByIdAndUpdate(req.user.id, { emailVerified: true });
    res.json({ message: 'Email verified successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to verify email.' });
  }
});

module.exports = router;