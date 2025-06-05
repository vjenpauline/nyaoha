const mongoose = require('mongoose');

// mongoose schema for email verification codes
const verificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // reference to the user
  code: { type: String, required: true }, // verification code
  expiresAt: { type: Date, required: true }, // expiration date of the code
  used: { type: Boolean, default: false } // status if the code is used
});

module.exports = mongoose.model('Verification', verificationSchema);
