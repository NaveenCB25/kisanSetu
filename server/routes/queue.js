const express = require('express');
const router = express.Router();
const { getQueueInfo, getQueuePosition } = require('../controllers/queueController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/:centerId', getQueueInfo);
router.get('/position/:bookingId', getQueuePosition);

module.exports = router;
