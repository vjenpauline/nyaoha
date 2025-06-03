const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  favorites: [{ type: String }],  // store plant 'pid' strings here
  photo: {
    data: { type: Buffer, default: null },
    contentType: { type: String, default: null }
  },
  emailVerified: { type: Boolean, default: false }
});

module.exports = mongoose.model('User', userSchema);
