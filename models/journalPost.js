// mongoose schema for journal posts
const mongoose = require('mongoose');

const journalPostSchema = new mongoose.Schema({
  title: { type: String, required: true }, // title of the journal post
  summary: { type: String, required: true }, // brief summary of the post
  tags: [{ type: String }], // array of tags associated with the post
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // reference to the author (User model)
  date: { type: String, required: true }, // date of the post
  createdAt: { type: Date, default: Date.now } // timestamp of when the post was created
});

module.exports = mongoose.model('JournalPost', journalPostSchema);
