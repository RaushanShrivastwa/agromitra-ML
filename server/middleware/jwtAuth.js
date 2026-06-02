const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = function(req, res, next) {
  let token = req.headers['authorization'];
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret', async (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Unauthorized' });
    try {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      if (user.banned) {
        return res.status(403).json({ message: 'Your account has been banned.' });
      }
      req.user = {
        id: user._id,
        email: user.email,
        role: user.role,
        banned: user.banned,
        username: user.username
      };
      next();
    } catch (error) {
      return res.status(500).json({ message: 'Server error during authentication' });
    }
  });
};
