const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  emailVerified: { type: Boolean, default: false, index: true },
  favorites: [{ type: String, index: true }]
});

module.exports = mongoose.model('User', userSchema);
