const express = require('express');
const router = express.Router();
const {
  createBooking, getMyBookings, getBooking,
  cancelBooking, rescheduleBooking, getRecommendation,
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');
const { validate, bookingSchema } = require('../middleware/validate');

router.use(protect);

router.post('/', authorize('farmer'), validate(bookingSchema), createBooking);
router.get('/my', authorize('farmer'), getMyBookings);
router.get('/recommend/:centerId/:date', authorize('farmer'), getRecommendation);
router.get('/:id', getBooking);
router.put('/:id/cancel', authorize('farmer'), cancelBooking);
router.put('/:id/reschedule', authorize('farmer'), rescheduleBooking);

module.exports = router;
