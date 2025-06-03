const mongoose = require('mongoose');

const journalPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  tags: [{ type: String }],
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Store as formatted string for display
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('JournalPost', journalPostSchema);
