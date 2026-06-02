const router = require('express').Router();
const cropCtrl = require('../controllers/cropController');
const jwtAuth = require('../middleware/jwtAuth');

router.post('/', jwtAuth, cropCtrl.createListing);
router.get('/', jwtAuth, cropCtrl.getListings);
router.get('/mandi-prices', jwtAuth, cropCtrl.getMandiPrices);
router.get('/mandi-states', jwtAuth, cropCtrl.getMandiStates);
router.delete('/:id', jwtAuth, cropCtrl.deleteListing);

module.exports = router;
