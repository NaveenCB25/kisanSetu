const Booking = require('../models/Booking');
const Procurement = require('../models/Procurement');
const ProcurementCenter = require('../models/ProcurementCenter');
const CropRate = require('../models/CropRate');
const QueueService = require('../services/queueService');
const { emitQueueUpdate, emitBookingStatusChange, emitCallNext } = require('../services/socketService');

// @desc    Get center dashboard for operator
// @route   GET /api/centers/dashboard
exports.getDashboard = async (req, res, next) => {
  try {
    const center = await ProcurementCenter.findOne({ operator: req.user._id });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [todayBookings, waitingCount, completedCount, totalQuantity] = await Promise.all([
      Booking.countDocuments({ center: center._id, date: { $gte: today, $lt: tomorrow } }),
      Booking.countDocuments({
        center: center._id,
        date: { $gte: today, $lt: tomorrow },
        status: { $in: ['checked-in', 'in-queue'] },
      }),
      Booking.countDocuments({
        center: center._id,
        date: { $gte: today, $lt: tomorrow },
        status: 'completed',
      }),
      Procurement.aggregate([
        { $match: { center: center._id, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, total: { $sum: '$actualWeight' } } },
      ]),
    ]);

    const currentlyServing = await Booking.findOne({
      center: center._id,
      date: { $gte: today, $lt: tomorrow },
      status: 'called',
    }).populate('user', 'name').populate('farmer', 'farmerId');

    res.json({
      success: true,
      data: {
        center: {
          _id: center._id,
          centerName: center.centerName,
          centerCode: center.centerCode,
          numberOfCounters: center.numberOfCounters,
          activeCounters: center.activeCounters,
          dailyCapacity: center.dailyCapacity,
        },
        today: {
          totalAppointments: todayBookings,
          farmersWaiting: waitingCount,
          completed: completedCount,
          totalQuantity: totalQuantity[0]?.total || 0,
          currentlyServing: currentlyServing
            ? { tokenNumber: currentlyServing.tokenNumber, farmerName: currentlyServing.user?.name }
            : null,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get today's appointments for the center
// @route   GET /api/centers/appointments
exports.getAppointments = async (req, res, next) => {
  try {
    const center = await ProcurementCenter.findOne({ operator: req.user._id });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    const { day = 'today' } = req.query;
    const targetDate = new Date();
    if (day === 'tomorrow') targetDate.setDate(targetDate.getDate() + 1);
    targetDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const bookings = await Booking.find({
      center: center._id,
      date: { $gte: targetDate, $lt: nextDay },
    })
      .populate('user', 'name mobile')
      .populate('farmer', 'farmerId village')
      .populate('slot', 'timeSlot')
      .sort({ queuePosition: 1, createdAt: 1 });

    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// @desc    Check-in a farmer
// @route   PUT /api/centers/checkin/:bookingId
exports.checkInFarmer = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const booking = await Booking.findById(req.params.bookingId).populate('user', 'name');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'booked') {
      return res.status(400).json({ success: false, message: 'Farmer is not in booked status' });
    }

    // Assign queue position
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const lastInQueue = await Booking.findOne({
      center: booking.center,
      date: { $gte: today, $lt: tomorrow },
      queuePosition: { $ne: null },
    }).sort({ queuePosition: -1 });

    booking.status = 'checked-in';
    booking.queuePosition = (lastInQueue?.queuePosition || 0) + 1;
    booking.stageTimestamps.checkedIn = new Date();
    await booking.save();

    // Move to in-queue
    booking.status = 'in-queue';
    booking.stageTimestamps.inQueue = new Date();
    await booking.save();

    // Emit queue update
    const queueInfo = await QueueService.getQueueInfo(booking.center);
    emitQueueUpdate(io, booking.center.toString(), queueInfo);
    emitBookingStatusChange(io, booking.user._id?.toString() || booking.user.toString(), {
      bookingId: booking._id,
      status: booking.status,
      queuePosition: booking.queuePosition,
    });

    // Notify farmer
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: booking.user._id || booking.user,
        title: 'Checked In ✅',
        message: `You are in the queue. Position: ${booking.queuePosition}`,
        type: 'queue',
        relatedBooking: booking._id,
      });
    }

    res.json({ success: true, message: 'Farmer checked in', data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark no-show
// @route   PUT /api/centers/noshow/:bookingId
exports.markNoShow = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'no-show';
    booking.stageTimestamps.noShow = new Date();
    await booking.save();

    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: booking.user,
        title: 'Marked as No-Show',
        message: `Your booking ${booking.tokenNumber} was marked as no-show.`,
        type: 'status',
        relatedBooking: booking._id,
      });
    }

    res.json({ success: true, message: 'Marked as no-show', data: booking });
  } catch (error) {
    next(error);
  }
};

// @desc    Call next farmer
// @route   PUT /api/centers/call-next
exports.callNextFarmer = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const center = await ProcurementCenter.findOne({ operator: req.user._id });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find next farmer in queue
    const nextFarmer = await Booking.findOne({
      center: center._id,
      date: { $gte: today, $lt: tomorrow },
      status: 'in-queue',
    })
      .sort({ queuePosition: 1 })
      .populate('user', 'name mobile')
      .populate('farmer', 'farmerId');

    if (!nextFarmer) {
      return res.status(404).json({ success: false, message: 'No more farmers in the queue' });
    }

    nextFarmer.status = 'called';
    nextFarmer.stageTimestamps.called = new Date();
    await nextFarmer.save();

    // Emit events
    const queueInfo = await QueueService.getQueueInfo(center._id);
    emitQueueUpdate(io, center._id.toString(), queueInfo);
    emitCallNext(io, center._id.toString(), {
      tokenNumber: nextFarmer.tokenNumber,
      farmerName: nextFarmer.user?.name,
    });
    emitBookingStatusChange(io, nextFarmer.user._id.toString(), {
      bookingId: nextFarmer._id,
      status: 'called',
      tokenNumber: nextFarmer.tokenNumber,
    });

    // Notify the farmer
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: nextFarmer.user._id,
        title: 'Your Turn! 🔔',
        message: `Token ${nextFarmer.tokenNumber} — Please proceed to the counter.`,
        type: 'queue',
        relatedBooking: nextFarmer._id,
      });
    }

    res.json({
      success: true,
      message: 'Next farmer called',
      data: {
        tokenNumber: nextFarmer.tokenNumber,
        farmerName: nextFarmer.user?.name,
        farmerId: nextFarmer.farmer?.farmerId,
        cropName: nextFarmer.cropName,
        declaredQuantity: nextFarmer.declaredQuantity,
        bookingId: nextFarmer._id,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Submit weighing & quality data
// @route   POST /api/centers/weighing/:bookingId
exports.submitWeighing = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const { actualWeight, qualityGrade } = req.body;
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Move through stages
    booking.status = 'weighing';
    booking.stageTimestamps.weighing = new Date();
    await booking.save();

    // Get rate from MSP table
    const cropRate = await CropRate.findOne({ cropName: booking.cropName, isActive: true });
    let ratePerQuintal = 0;

    if (cropRate) {
      switch (qualityGrade) {
        case 'A': ratePerQuintal = cropRate.gradeARate; break;
        case 'B': ratePerQuintal = cropRate.gradeBRate; break;
        case 'C': ratePerQuintal = cropRate.gradeCRate; break;
        default: ratePerQuintal = cropRate.mspRate;
      }
    }

    const totalAmount = actualWeight * ratePerQuintal;

    // Quality check stage
    booking.status = 'quality-check';
    booking.stageTimestamps.qualityCheck = new Date();
    await booking.save();

    // Create procurement record
    const checkedInTime = booking.stageTimestamps.checkedIn || booking.stageTimestamps.booked;
    const now = new Date();

    const procurement = await Procurement.create({
      booking: booking._id,
      farmer: booking.farmer,
      center: booking.center,
      cropName: booking.cropName,
      declaredWeight: booking.declaredQuantity,
      actualWeight,
      qualityGrade,
      ratePerQuintal,
      totalAmount,
      stageDurations: {
        checkIn: Math.round((booking.stageTimestamps.called - checkedInTime) / 60000) || 0,
        weighing: Math.round((now - booking.stageTimestamps.called) / 60000) || 0,
        qualityCheck: 2, // estimated
        payment: 0,
        total: Math.round((now - checkedInTime) / 60000) || 0,
      },
    });

    // Move to payment stage
    booking.status = 'payment';
    booking.stageTimestamps.payment = new Date();
    await booking.save();

    emitBookingStatusChange(io, booking.user.toString(), {
      bookingId: booking._id,
      status: 'payment',
    });

    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: booking.user,
        title: 'Weighing Complete ⚖️',
        message: `Weight: ${actualWeight}q, Grade: ${qualityGrade}, Amount: ₹${totalAmount.toLocaleString()}`,
        type: 'status',
        relatedBooking: booking._id,
      });
    }

    res.json({
      success: true,
      data: {
        procurement,
        booking: {
          _id: booking._id,
          tokenNumber: booking.tokenNumber,
          status: booking.status,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Process payment
// @route   PUT /api/centers/payment/:bookingId
exports.processPayment = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const procurement = await Procurement.findOne({ booking: req.params.bookingId });
    if (!procurement) {
      return res.status(404).json({ success: false, message: 'Procurement record not found' });
    }

    procurement.paymentStatus = 'processed';
    procurement.paymentDate = new Date();
    await procurement.save();

    const booking = await Booking.findById(req.params.bookingId);

    const notificationService = req.app.get('notificationService');
    if (notificationService && booking) {
      await notificationService.send({
        userId: booking.user,
        title: 'Payment Processed 💰',
        message: `₹${procurement.totalAmount.toLocaleString()} for ${procurement.actualWeight}q of ${procurement.cropName}`,
        type: 'payment',
        relatedBooking: booking._id,
      });
    }

    res.json({ success: true, message: 'Payment processed', data: procurement });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark procurement as completed
// @route   PUT /api/centers/complete/:bookingId
exports.completeProcurement = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    booking.status = 'completed';
    booking.stageTimestamps.completed = new Date();
    await booking.save();

    // Update procurement stage durations
    const procurement = await Procurement.findOne({ booking: booking._id });
    if (procurement) {
      const checkedIn = booking.stageTimestamps.checkedIn || booking.stageTimestamps.booked;
      procurement.stageDurations.total = Math.round(
        (booking.stageTimestamps.completed - checkedIn) / 60000
      );
      procurement.stageDurations.payment = Math.round(
        (booking.stageTimestamps.completed - (booking.stageTimestamps.payment || booking.stageTimestamps.qualityCheck)) / 60000
      );
      await procurement.save();
    }

    // Emit updates
    const queueInfo = await QueueService.getQueueInfo(booking.center);
    emitQueueUpdate(io, booking.center.toString(), queueInfo);
    emitBookingStatusChange(io, booking.user.toString(), {
      bookingId: booking._id,
      status: 'completed',
    });

    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: booking.user,
        title: 'Procurement Complete ✅',
        message: `Your procurement (Token: ${booking.tokenNumber}) is complete. View your digital receipt.`,
        type: 'status',
        relatedBooking: booking._id,
      });
    }

    res.json({ success: true, message: 'Procurement completed', data: { booking, procurement } });
  } catch (error) {
    next(error);
  }
};

// @desc    Get payment ledger
// @route   GET /api/centers/payments
exports.getPaymentLedger = async (req, res, next) => {
  try {
    const center = await ProcurementCenter.findOne({ operator: req.user._id });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const query = { center: center._id };
    if (status) query.paymentStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [procurements, total] = await Promise.all([
      Procurement.find(query)
        .populate('farmer', 'farmerId')
        .populate({ path: 'booking', select: 'tokenNumber user', populate: { path: 'user', select: 'name mobile' } })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Procurement.countDocuments(query),
    ]);

    const totals = await Procurement.aggregate([
      { $match: { center: center._id } },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$totalAmount' },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$totalAmount', 0] },
          },
          processedAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'processed'] }, '$totalAmount', 0] },
          },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        procurements,
        totals: totals[0] || { totalAmount: 0, pendingAmount: 0, processedAmount: 0 },
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get bottleneck view for center
// @route   GET /api/centers/bottleneck
exports.getBottleneckView = async (req, res, next) => {
  try {
    const center = await ProcurementCenter.findOne({ operator: req.user._id });
    if (!center) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    const procurements = await Procurement.find({ center: center._id })
      .sort({ createdAt: -1 })
      .limit(50);

    const stages = ['checkIn', 'weighing', 'qualityCheck', 'payment'];
    const averages = {};

    stages.forEach((stage) => {
      const times = procurements
        .map((p) => p.stageDurations?.[stage] || 0)
        .filter((t) => t > 0);
      const avg = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;

      let severity = 'normal';
      if (avg > 20) severity = 'critical';
      else if (avg > 10) severity = 'warning';

      averages[stage] = { average: avg, severity };
    });

    res.json({ success: true, data: { centerName: center.centerName, stages: averages } });
  } catch (error) {
    next(error);
  }
};
