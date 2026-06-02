const router = require('express').Router();
const adminCtrl = require('../controllers/adminController');
const jwtAuth = require('../middleware/jwtAuth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

// Middleware to verify admin role
const verifyAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Forbidden: Admin access required.' });
  }
};

// Protect all admin routes with JWT Auth + Admin verification
router.use(jwtAuth);
router.use(verifyAdmin);

router.get('/users', adminCtrl.getUsers);
router.put('/users/:id/ban', adminCtrl.toggleBanUser);
router.get('/logs', adminCtrl.getSystemLogs);
router.get('/soil-requests', adminCtrl.getSoilRequests);
router.put('/soil-requests/:id', adminCtrl.updateSoilRequest);
router.get('/orders', adminCtrl.getAllOrders);
router.put('/orders/:id', adminCtrl.updateOrderStatus);
router.get('/products', adminCtrl.getAllProducts);
router.post('/products', adminCtrl.createProduct);
router.post('/products/upload', upload.single('file'), adminCtrl.uploadProductImage);
router.put('/products/:id', adminCtrl.updateProduct);
router.delete('/products/:id', adminCtrl.deleteProduct);

router.get('/crops', adminCtrl.getAllCrops);
router.put('/crops/:id/approval', adminCtrl.approveCropListing);

module.exports = router;
