const User = require('../models/User');
const Farmer = require('../models/Farmer');
const ProcurementCenter = require('../models/ProcurementCenter');
const Booking = require('../models/Booking');
const Procurement = require('../models/Procurement');
const CropRate = require('../models/CropRate');

// @desc    Get admin overview
// @route   GET /api/admin/overview
exports.getOverview = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalFarmers,
      totalCenters,
      pendingCenters,
      todayBookings,
      todayProcurements,
      pendingPayouts,
      totalQuantity,
    ] = await Promise.all([
      Farmer.countDocuments(),
      ProcurementCenter.countDocuments({ status: 'approved' }),
      ProcurementCenter.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ date: { $gte: today, $lt: tomorrow } }),
      Procurement.countDocuments({ createdAt: { $gte: today, $lt: tomorrow } }),
      Procurement.aggregate([
        { $match: { paymentStatus: 'pending' } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      Procurement.aggregate([
        { $group: { _id: null, total: { $sum: '$actualWeight' } } },
      ]),
    ]);

    res.json({
      success: true,
      data: {
        totalFarmers,
        totalCenters,
        pendingCenters,
        todayBookings,
        todayProcurements,
        pendingPayouts: pendingPayouts[0]?.total || 0,
        totalQuantity: totalQuantity[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all centers (with filter)
// @route   GET /api/admin/centers
exports.getCenters = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = {};
    if (status) query.status = status;

    const centers = await ProcurementCenter.find(query)
      .populate('operator', 'name mobile')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: centers });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve/reject a center
// @route   PUT /api/admin/centers/:id/status
exports.updateCenterStatus = async (req, res, next) => {
  try {
    const { status } = req.body; // approved or rejected
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const center = await ProcurementCenter.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate('operator', 'name mobile');

    if (!center) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    // Notify operator
    const notificationService = req.app.get('notificationService');
    if (notificationService) {
      await notificationService.send({
        userId: center.operator._id || center.operator,
        title: status === 'approved' ? 'Center Approved! 🎉' : 'Center Registration Rejected',
        message: status === 'approved'
          ? `Your center "${center.centerName}" has been approved. You can now receive bookings.`
          : `Your center "${center.centerName}" registration was rejected. Contact admin for details.`,
        type: 'approval',
      });
    }

    res.json({ success: true, message: `Center ${status}`, data: center });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle center active/inactive
// @route   PUT /api/admin/centers/:id/toggle
exports.toggleCenter = async (req, res, next) => {
  try {
    const center = await ProcurementCenter.findById(req.params.id);
    if (!center) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }

    center.isActive = !center.isActive;
    await center.save();

    res.json({
      success: true,
      message: `Center ${center.isActive ? 'activated' : 'deactivated'}`,
      data: center,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add center directly by admin
// @route   POST /api/admin/centers
exports.addCenter = async (req, res, next) => {
  try {
    const {
      centerName, centerCode, address, district, numberOfCounters,
      dailyCapacity, operatingHoursStart, operatingHoursEnd,
      cropsHandled, operatorName, operatorMobile, operatorPassword,
    } = req.body;

    const existingUser = await User.findOne({ mobile: operatorMobile });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Operator mobile already registered' });
    }

    const operator = await User.create({
      name: operatorName,
      mobile: operatorMobile,
      password: operatorPassword,
      role: 'operator',
    });

    const center = await ProcurementCenter.create({
      centerName,
      centerCode,
      address,
      district,
      numberOfCounters,
      dailyCapacity,
      operatingHours: { start: operatingHoursStart || '08:00', end: operatingHoursEnd || '17:00' },
      cropsHandled,
      operator: operator._id,
      status: 'approved', // Admin-added centers are auto-approved
    });

    res.status(201).json({ success: true, message: 'Center created', data: center });
  } catch (error) {
    next(error);
  }
};

// @desc    Analytics — daily procurement trend (last 7 days)
// @route   GET /api/admin/analytics/daily-trend
exports.getDailyTrend = async (req, res, next) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const trend = await Procurement.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
          quantity: { $sum: '$actualWeight' },
          amount: { $sum: '$totalAmount' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ success: true, data: trend });
  } catch (error) {
    next(error);
  }
};

// @desc    Analytics — crop-wise quantity
// @route   GET /api/admin/analytics/crop-wise
exports.getCropWise = async (req, res, next) => {
  try {
    const data = await Procurement.aggregate([
      {
        $group: {
          _id: '$cropName',
          totalQuantity: { $sum: '$actualWeight' },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Analytics — center-wise load
// @route   GET /api/admin/analytics/center-load
exports.getCenterLoad = async (req, res, next) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const data = await Booking.aggregate([
      { $match: { date: { $gte: today, $lt: tomorrow } } },
      {
        $group: {
          _id: '$center',
          totalBookings: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          waiting: {
            $sum: { $cond: [{ $in: ['$status', ['checked-in', 'in-queue']] }, 1, 0] },
          },
        },
      },
      {
        $lookup: {
          from: 'procurementcenters',
          localField: '_id',
          foreignField: '_id',
          as: 'center',
        },
      },
      { $unwind: '$center' },
      {
        $project: {
          centerName: '$center.centerName',
          centerCode: '$center.centerCode',
          dailyCapacity: '$center.dailyCapacity',
          totalBookings: 1,
          completed: 1,
          waiting: 1,
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Analytics — average waiting time
// @route   GET /api/admin/analytics/waiting-time
exports.getWaitingTime = async (req, res, next) => {
  try {
    const data = await Procurement.aggregate([
      {
        $group: {
          _id: '$center',
          avgTotal: { $avg: '$stageDurations.total' },
          avgCheckIn: { $avg: '$stageDurations.checkIn' },
          avgWeighing: { $avg: '$stageDurations.weighing' },
          avgQualityCheck: { $avg: '$stageDurations.qualityCheck' },
          avgPayment: { $avg: '$stageDurations.payment' },
        },
      },
      {
        $lookup: {
          from: 'procurementcenters',
          localField: '_id',
          foreignField: '_id',
          as: 'center',
        },
      },
      { $unwind: '$center' },
      {
        $project: {
          centerName: '$center.centerName',
          avgTotal: { $round: ['$avgTotal', 1] },
          avgCheckIn: { $round: ['$avgCheckIn', 1] },
          avgWeighing: { $round: ['$avgWeighing', 1] },
          avgQualityCheck: { $round: ['$avgQualityCheck', 1] },
          avgPayment: { $round: ['$avgPayment', 1] },
        },
      },
    ]);

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

// @desc    Bottleneck detector across all centers
// @route   GET /api/admin/bottleneck
exports.getBottleneck = async (req, res, next) => {
  try {
    const centers = await ProcurementCenter.find({ status: 'approved' });
    const result = [];

    for (const center of centers) {
      const procurements = await Procurement.find({ center: center._id })
        .sort({ createdAt: -1 })
        .limit(50);

      const stages = ['checkIn', 'weighing', 'qualityCheck', 'payment'];
      const stageData = {};

      stages.forEach((stage) => {
        const times = procurements
          .map((p) => p.stageDurations?.[stage] || 0)
          .filter((t) => t > 0);
        const avg = times.length > 0
          ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
          : 0;

        let severity = 'normal';
        if (avg > 20) severity = 'critical';
        else if (avg > 10) severity = 'warning';

        stageData[stage] = { average: avg, severity };
      });

      result.push({
        centerId: center._id,
        centerName: center.centerName,
        centerCode: center.centerCode,
        stages: stageData,
      });
    }

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

// @desc    Get MSP / crop rate table
// @route   GET /api/admin/crop-rates
exports.getCropRates = async (req, res, next) => {
  try {
    const rates = await CropRate.find().sort({ cropCategory: 1, cropName: 1 });
    res.json({ success: true, data: rates });
  } catch (error) {
    next(error);
  }
};

// @desc    Add/update crop rate
// @route   POST /api/admin/crop-rates
exports.upsertCropRate = async (req, res, next) => {
  try {
    const { cropCategory, cropName, mspRate, gradeARate, gradeBRate, gradeCRate, season } = req.body;

    const rate = await CropRate.findOneAndUpdate(
      { cropCategory, cropName },
      { mspRate, gradeARate, gradeBRate, gradeCRate, season: season || 'all', isActive: true },
      { upsert: true, new: true }
    );

    res.json({ success: true, data: rate });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete crop rate
// @route   DELETE /api/admin/crop-rates/:id
exports.deleteCropRate = async (req, res, next) => {
  try {
    await CropRate.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Crop rate deleted' });
  } catch (error) {
    next(error);
  }
};
