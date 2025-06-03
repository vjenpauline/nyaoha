const express = require('express');
const router = express.Router();
const JournalPost = require('../models/journalPost');

// Get all posts (newest first)
router.get('/', async (req, res) => {
  try {
    const posts = await JournalPost.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

// Create a new post (no auth required)
router.post('/', async (req, res) => {
  const { title, summary, tags, author, date } = req.body;
  if (!title || !summary || !author || !date) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    const post = new JournalPost({ title, summary, tags, author, date });
    await post.save();
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: 'Failed to save post.' });
  }
});

// Delete a post by ID (auth required in real app)
router.delete('/:id', async (req, res) => {
  try {
    const post = await JournalPost.findByIdAndDelete(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found.' });
    res.json({ message: 'Post deleted.' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete post.' });
  }
});

module.exports = router;
