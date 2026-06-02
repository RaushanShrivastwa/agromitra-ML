const router = require('express').Router();
const notifCtrl = require('../controllers/notificationController');
const jwtAuth = require('../middleware/jwtAuth');

const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};

router.get('/', jwtAuth, notifCtrl.getNotifications);
router.post('/', jwtAuth, adminCheck, notifCtrl.createNotification);
router.delete('/:id', jwtAuth, adminCheck, notifCtrl.deleteNotification);

module.exports = router;
