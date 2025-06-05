const mongoose = require('mongoose');

// mongoose schema for user data
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  emailVerified: { type: Boolean, default: false, index: true }, // can be verified through email verification on website
  favorites: [{ type: String, index: true }] // array of favorite plant names
});

module.exports = mongoose.model('User', userSchema);
