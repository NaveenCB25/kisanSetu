const express = require('express');
const router = express.Router();
const {
  getOverview, getCenters, updateCenterStatus, toggleCenter, addCenter,
  getDailyTrend, getCropWise, getCenterLoad, getWaitingTime,
  getBottleneck, getCropRates, upsertCropRate, deleteCropRate,
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('admin'));

router.get('/overview', getOverview);
router.get('/centers', getCenters);
router.post('/centers', addCenter);
router.put('/centers/:id/status', updateCenterStatus);
router.put('/centers/:id/toggle', toggleCenter);

// Analytics
router.get('/analytics/daily-trend', getDailyTrend);
router.get('/analytics/crop-wise', getCropWise);
router.get('/analytics/center-load', getCenterLoad);
router.get('/analytics/waiting-time', getWaitingTime);

// Bottleneck
router.get('/bottleneck', getBottleneck);

// Crop rates
router.get('/crop-rates', getCropRates);
router.post('/crop-rates', upsertCropRate);
router.delete('/crop-rates/:id', deleteCropRate);

module.exports = router;
