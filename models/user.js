const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName:  { type: String, required: true },
  email:     { type: String, required: true, unique: true },
  password:  { type: String, required: true },
  favorites: [{ type: String }],  // store plant 'pid' strings here
  photo: { data: Buffer, contentType: String } // Add this line for profile photo
});

module.exports = mongoose.model('User', userSchema);
