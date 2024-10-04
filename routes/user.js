const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated } = require('../middleware/auth');
const User = require('../models/User');

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile')
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

router.get('/profile', ensureAuthenticated, (req, res) => {
  res.render('profile', { user: req.user });
});

router.post('/profile', ensureAuthenticated, upload.single('profileImage'), async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    user.name = req.body.name;
    user.bio = req.body.bio;
    if (req.file) {
      if (user.profileImage && user.profileImage !== 'default.jpg') {
        fs.unlinkSync(path.join(__dirname, '../uploads/profile', user.profileImage));
      }
      user.profileImage = req.file.filename;
    }
    await user.save();
    req.flash('success_msg', 'Profile updated successfully');
    res.redirect('/user/profile');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error updating profile');
    res.redirect('/user/profile');
  }
});

module.exports = router;