const router = require('express').Router();
const faqCtrl = require('../controllers/faqController');
const jwtAuth = require('../middleware/jwtAuth');

const adminCheck = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required' });
  }
};

router.get('/', faqCtrl.getFaqs);
router.get('/training-data', faqCtrl.getTrainingData);
router.post('/', jwtAuth, adminCheck, faqCtrl.createFaq);
router.delete('/:id', jwtAuth, adminCheck, faqCtrl.deleteFaq);

module.exports = router;
