// express route for journal posts
const express = require('express');
const router = express.Router();
const JournalPost = require('../models/journalPost');
const auth = require('../middleware/auth');
const User = require('../models/user');

// get all journal posts
router.get('/', async (req, res) => {
  try {
    const posts = await JournalPost.find().sort({ createdAt: -1 }).populate('author', 'firstName lastName email');
    const formatted = posts.map(post => ({
      ...post.toObject(),
      author: post.author ? `${post.author.firstName} ${post.author.lastName}` : 'Unknown',
      authorId: post.author ? post.author._id?.toString() : undefined
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch posts.' });
  }
});

// create a new journal post
router.post('/', auth, async (req, res) => {
  const { title, summary, tags, date } = req.body;
  if (!title || !summary || !date) {
    return res.status(400).json({ message: 'Missing required fields.' });
  }
  try {
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
    await post.populate('author', 'firstName lastName email');
    res.status(201).json({
      ...post.toObject(),
      author: `${user.firstName} ${user.lastName}`
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to save post.' });
  }
});

// delete a journal post
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
