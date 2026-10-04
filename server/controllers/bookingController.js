const Booking = require('../models/Booking');
const Slot = require('../models/Slot');
const Farmer = require('../models/Farmer');
const ProcurementCenter = require('../models/ProcurementCenter');
const QueueService = require('../services/queueService');
const { emitQueueUpdate } = require('../services/socketService');

// @desc    Create a booking
// @route   POST /api/bookings
exports.createBooking = async (req, res, next) => {
  try {
    const { centerId, slotId, date, cropCategory, cropName, declaredQuantity } = req.body;

    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    }

    // Check slot availability
    const slot = await Slot.findById(slotId);
    if (!slot || !slot.isAvailable || slot.currentBookings >= slot.maxCapacity) {
      return res.status(400).json({ success: false, message: 'Selected slot is not available' });
    }

    // Check if farmer already has a booking for this date at this center
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const existingBooking = await Booking.findOne({
      farmer: farmer._id,
      center: centerId,
      date: bookingDate,
      status: { $nin: ['cancelled', 'completed', 'no-show'] },
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active booking at this center for this date',
      });
    }

    // Create booking
    const booking = await Booking.create({
      farmer: farmer._id,
      user: req.user._id,
      center: centerId,
      slot: slotId,
      date: bookingDate,
      cropCategory,
      cropName,
      declaredQuantity,
      stageTimestamps: { booked: new Date() },
    });

    // Update slot bookings count
    slot.currentBookings += 1;
    if (slot.currentBookings >= slot.maxCapacity) {
      slot.isAvailable = false;
    }
    await slot.save();

    // Send notification
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: req.user._id,
        title: 'Booking Confirmed! 🎉',
        message: `Token: ${booking.tokenNumber}. Slot: ${slot.timeSlot.start}-${slot.timeSlot.end}. Bring ${declaredQuantity} quintals of ${cropName}.`,
        type: 'booking',
        relatedBooking: booking._id,
      });
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed',
      data: {
        booking: {
          _id: booking._id,
          tokenNumber: booking.tokenNumber,
          date: booking.date,
          cropCategory: booking.cropCategory,
          cropName: booking.cropName,
          declaredQuantity: booking.declaredQuantity,
          status: booking.status,
          timeSlot: slot.timeSlot,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get farmer's bookings
// @route   GET /api/bookings/my
exports.getMyBookings = async (req, res, next) => {
  try {
    const farmer = await Farmer.findOne({ user: req.user._id });
    if (!farmer) {
      return res.status(404).json({ success: false, message: 'Farmer profile not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { farmer: farmer._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      Booking.find(query)
        .populate('center', 'centerName centerCode address district')
        .populate('slot', 'timeSlot')
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Booking.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        bookings,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single booking details
// @route   GET /api/bookings/:id
exports.getBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('center', 'centerName centerCode address district')
      .populate('slot', 'timeSlot')
      .populate('farmer', 'farmerId village district');

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Check ownership or operator/admin access
    if (
      req.user.role === 'farmer' &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    res.json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel a booking
// @route   PUT /api/bookings/:id/cancel
exports.cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (['completed', 'cancelled', 'no-show'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Cannot cancel this booking' });
    }

    booking.status = 'cancelled';
    booking.stageTimestamps.cancelled = new Date();
    await booking.save();

    // Free up the slot
    await Slot.findByIdAndUpdate(booking.slot, {
      $inc: { currentBookings: -1 },
      isAvailable: true,
    });

    // Notify
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: req.user._id,
        title: 'Booking Cancelled',
        message: `Your booking ${booking.tokenNumber} has been cancelled.`,
        type: 'booking',
        relatedBooking: booking._id,
      });
    }

    res.json({ success: true, message: 'Booking cancelled', data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Reschedule a booking
// @route   PUT /api/bookings/:id/reschedule
exports.rescheduleBooking = async (req, res, next) => {
  try {
    const { slotId, date } = req.body;
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    if (!['booked'].includes(booking.status)) {
      return res.status(400).json({ success: false, message: 'Can only reschedule booked appointments' });
    }

    // Free old slot
    await Slot.findByIdAndUpdate(booking.slot, {
      $inc: { currentBookings: -1 },
      isAvailable: true,
    });

    // Check new slot
    const newSlot = await Slot.findById(slotId);
    if (!newSlot || newSlot.currentBookings >= newSlot.maxCapacity) {
      return res.status(400).json({ success: false, message: 'New slot is not available' });
    }

    // Update booking
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    booking.slot = slotId;
    booking.date = newDate;
    await booking.save();

    // Update new slot
    newSlot.currentBookings += 1;
    if (newSlot.currentBookings >= newSlot.maxCapacity) {
      newSlot.isAvailable = false;
    }
    await newSlot.save();

    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: req.user._id,
        title: 'Booking Rescheduled',
        message: `Your booking ${booking.tokenNumber} has been rescheduled to ${newSlot.timeSlot.start}-${newSlot.timeSlot.end}.`,
        type: 'booking',
        relatedBooking: booking._id,
      });
    }

    res.json({ success: true, message: 'Booking rescheduled', data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Get smart advisor recommendation
// @route   GET /api/bookings/recommend/:centerId/:date
exports.getRecommendation = async (req, res, next) => {
  try {
    const { centerId, date } = req.params;
    const recommendation = await QueueService.recommendSlot(centerId, new Date(date));

    if (!recommendation) {
      return res.status(404).json({ success: false, message: 'No available slots for this date' });
    }

    res.json({ success: true, data: recommendation });
  } catch (error) {
    next(error);
  }
};
