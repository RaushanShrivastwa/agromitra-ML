require('dotenv').config();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

// List of admin emails (assign 'admin' role if matched)
const adminEmails = ['admin@example.com', 'manager@yourdomain.com'];

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: (process.env.BASE_URL || 'http://localhost:5000') + '/auth/google/callback',
    passReqToCallback: true
  },
  async (req, accessToken, refreshToken, profile, done) => {
    try {
      if (!profile.emails || !profile.emails.length) {
        return done(new Error('No email found in Google profile'), null);
      }
      const email = profile.emails[0].value;

      let role = 'customer'; // Default fallback
      if (req.query && req.query.state) {
        try {
          const stateObj = JSON.parse(req.query.state);
          if (stateObj.role) {
            const parsedRole = stateObj.role.toLowerCase();
            if (parsedRole === 'farmer' || parsedRole === 'customer') {
              role = parsedRole;
            }
          }
        } catch (e) {
          console.error('Error parsing OAuth state:', e);
        }
      }

      // Override if admin
      if (adminEmails.includes(email)) {
        role = 'admin';
      }

      let user = await User.findOne({ email });
      if (user) {
        // Existing user
        return done(null, user);
      }
      // Create new user (OAuth users are marked verified)
      user = await User.create({
        username: profile.displayName,
        email: email,
        phno: '',
        provider: 'google',
        role: role,
        verified: true
      });
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;
