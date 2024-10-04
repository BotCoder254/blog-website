const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Blog = require('../models/Blog');

router.get('/', async (req, res) => {
  try {
    const recentBlogs = await Blog.find().sort({ date: -1 }).limit(3).populate('author', 'name profileImage');
    res.render('landing', { recentBlogs });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

router.get('/dashboard', ensureAuthenticated, async (req, res) => {
  try {
    const blogs = await Blog.find({ author: req.user.id }).sort({ date: -1 });
    res.render('dashboard', {
      user: req.user,
      blogs
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;