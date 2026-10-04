const express = require('express');
const router = express.Router();
const { getSlots, getApprovedCenters } = require('../controllers/slotController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/centers', getApprovedCenters);
router.get('/:centerId/:date', getSlots);

module.exports = router;
