const router = require('express').Router();
const cropCtrl = require('../controllers/cropController');
const jwtAuth = require('../middleware/jwtAuth');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });

router.post('/', jwtAuth, cropCtrl.createListing);
router.post('/upload', jwtAuth, upload.single('file'), cropCtrl.uploadCropImage);
router.get('/', jwtAuth, cropCtrl.getListings);
router.get('/mandi-prices', jwtAuth, cropCtrl.getMandiPrices);
router.get('/mandi-states', jwtAuth, cropCtrl.getMandiStates);
router.get('/categories', jwtAuth, cropCtrl.getCategories);
router.delete('/:id', jwtAuth, cropCtrl.deleteListing);

module.exports = router;
