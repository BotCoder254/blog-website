const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const User = require('../models/User');

router.get('/login', (req, res) => res.render('login'));
router.get('/register', (req, res) => res.render('register'));

router.post('/register', async (req, res) => {
    const { username, email, password, password2 } = req.body; // Change 'name' to 'username'
    let errors = [];
  
    if (!username || !email || !password || !password2) {
      errors.push({ msg: 'Please enter all fields' });
    }
  
    if (password !== password2) {
      errors.push({ msg: 'Passwords do not match' });
    }
  
    if (password.length < 6) {
      errors.push({ msg: 'Password must be at least 6 characters' });
    }
  
    if (errors.length > 0) {
      return res.render('register', {
        errors,
        username,
        email,
        password,
        password2
      });
    }
  
    try {
      let user = await User.findOne({ username: username }); // Check for existing username
      if (user) {
        errors.push({ msg: 'Username already exists' });
        return res.render('register', {
          errors,
          username,
          email,
          password,
          password2
        });
      }
  
      user = await User.findOne({ email: email }); // Check for existing email
      if (user) {
        errors.push({ msg: 'Email already exists' });
        return res.render('register', {
          errors,
          username,
          email,
          password,
          password2
        });
      }
  
      const newUser = new User({
        username,
        email,
        password
      });
  
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(newUser.password, salt, (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          newUser.save()
            .then(user => {
              req.flash(
                'success_msg',
                'You are now registered and can log in'
              );
              res.redirect('/auth/login');
            })
            .catch(err => console.log(err));
        });
      });
    } catch (err) {
      console.error(err);
      res.status(500).send('Server error');
    }
  });
  

// Login logic
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/auth/login',
    failureFlash: true
  })(req, res, next);
});

router.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    req.flash('success_msg', 'You are logged out');
    res.redirect('/views/login.ejs');
  });
});

module.exports = router;
