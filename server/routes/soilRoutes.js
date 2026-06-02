const router = require('express').Router();
const soilCtrl = require('../controllers/soilController');
const jwtAuth = require('../middleware/jwtAuth');

router.post('/request', jwtAuth, soilCtrl.createRequest);
router.get('/my-requests', jwtAuth, soilCtrl.getMyRequests);

module.exports = router;
