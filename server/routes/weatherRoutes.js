const router = require('express').Router();
const weatherCtrl = require('../controllers/weatherController');
const jwtAuth = require('../middleware/jwtAuth');

router.get('/live', jwtAuth, weatherCtrl.getLiveWeather);
router.get('/weekly', jwtAuth, weatherCtrl.getWeeklyWeather);

module.exports = router;
