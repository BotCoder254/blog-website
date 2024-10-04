const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated } = require('../middleware/auth');
const Blog = require('../models/Blog');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/blog')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.get('/create', ensureAuthenticated, (req, res) => res.render('create-blog'));

router.post('/create', ensureAuthenticated, upload.single('media'), async (req, res) => {
  const { title, content } = req.body;
  const newBlog = new Blog({
    title,
    content,
    author: req.user.id,
    media: req.file ? req.file.filename : null
  });

  try {
    await newBlog.save();
    req.flash('success_msg', 'Blog post created successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creating blog post');
    res.render('create-blog', {
      title,
      content
    });
  }
});

router.get('/edit/:id', ensureAuthenticated, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog.author.toString() !== req.user.id) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/dashboard');
    }
    res.render('edit-blog', { blog });
  } catch (err) {
    console.error(err);
    res.redirect('/dashboard');
  }
});

router.post('/edit/:id', ensureAuthenticated, upload.single('media'), async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog.author.toString() !== req.user.id) {
      req.flash('error_msg', 'Not authorized');
      return res.redirect('/dashboard');
    }
    blog.title = req.body.title;
    blog.content = req.body.content;
    if (req.file) {
      if (blog.media) {
        fs.unlinkSync(path.join(__dirname, '../uploads/blog', blog.media));
      }
      blog.media = req.file.filename;
    }
    await blog.save();
    req.flash('success_msg', 'Blog post updated successfully');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating blog post');
    res.redirect('/dashboard');
  }
});

router.delete('/delete/:id', ensureAuthenticated, async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (blog.author.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'Not authorized' });
    }
    if (blog.media) {
      fs.unlinkSync(path.join(__dirname, '../uploads/blog', blog.media));
    }
    await blog.remove();
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;