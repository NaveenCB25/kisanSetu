const express = require('express');
const router = express.Router();
const { getReceipt, downloadReceiptPDF } = require('../controllers/procurementController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/receipt/:bookingId', getReceipt);
router.get('/receipt/:bookingId/pdf', downloadReceiptPDF);

module.exports = router;
