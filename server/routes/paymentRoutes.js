const router = require('express').Router();
const paymentCtrl = require('../controllers/paymentController');
const jwtAuth = require('../middleware/jwtAuth');

router.post('/order', jwtAuth, paymentCtrl.createOrder);
router.post('/verify', jwtAuth, paymentCtrl.verifyPayment);
router.get('/my-orders', jwtAuth, paymentCtrl.getMyOrders);

module.exports = router;
