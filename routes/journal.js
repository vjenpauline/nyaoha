const express = require('express');
const router = express.Router();
const JournalPost = require('../models/journalPost');
const auth = require('../middleware/auth');
const User = require('../models/user');

// Get all posts (newest first)
router.get('/', async (req, res) => {
  try {
    const posts = await JournalPost.find().sort({ createdAt: -1 }).populate('author', 'firstName lastName email');
    // Format author as a string for frontend
    const formatted = posts.map(post => ({
      ...post.toObject(),
      author: post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Unknown'
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

// Create a new post (auth required)
router.post('/', auth, async (req, res) => {
  const { title, summary, tags, date } = req.body;
  if (!title || !summary || !date) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
    // Use user id from token
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ message: 'User not found.' });
    const post = new JournalPost({
      title,
      summary,
      tags,
      author: user._id,
      date
    });
    await post.save();
    // Populate author for response
    await post.populate('author', 'firstName lastName email');
    res.status(201).json({
      ...post.toObject(),
      author: `${user.firstName} ${user.lastName}`
    });
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
