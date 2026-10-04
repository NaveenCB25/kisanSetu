const express = require('express');
const router = express.Router();
const {
  getDashboard, getAppointments, checkInFarmer, markNoShow,
  callNextFarmer, submitWeighing, processPayment, completeProcurement,
  getPaymentLedger, getBottleneckView,
} = require('../controllers/centerController');
const { protect, authorize } = require('../middleware/auth');
const { validate, weighingSchema } = require('../middleware/validate');

router.use(protect, authorize('operator'));

router.get('/dashboard', getDashboard);
router.get('/appointments', getAppointments);
router.put('/checkin/:bookingId', checkInFarmer);
router.put('/noshow/:bookingId', markNoShow);
router.put('/call-next', callNextFarmer);
router.post('/weighing/:bookingId', validate(weighingSchema), submitWeighing);
router.put('/payment/:bookingId', processPayment);
router.put('/complete/:bookingId', completeProcurement);
router.get('/payments', getPaymentLedger);
router.get('/bottleneck', getBottleneckView);

module.exports = router;
