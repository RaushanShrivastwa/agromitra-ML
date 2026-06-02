const router = require('express').Router();
const passport = require('passport');
const authCtrl = require('../controllers/authController');

// Request OTP for signup
router.post('/request-otp', authCtrl.requestOTP);

// Verify OTP and create account
router.post('/verify-otp', authCtrl.verifyOTP);

// Local signin
router.post('/signin', authCtrl.signIn);

// Google OAuth routes
router.get('/auth/google', (req, res, next) => {
  const role = req.query.role || 'Customer';
  passport.authenticate('google', { 
    scope: ['profile', 'email'],
    state: JSON.stringify({ role })
  })(req, res, next);
});
router.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/' }), authCtrl.googleCallback);

// Logout (JWT protected)
const jwtAuth = require('../middleware/jwtAuth');
router.post('/logout', jwtAuth, authCtrl.logout);

module.exports = router;
