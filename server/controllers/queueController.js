const QueueService = require('../services/queueService');

// @desc    Get live queue info for a center
// @route   GET /api/queue/:centerId
exports.getQueueInfo = async (req, res, next) => {
  try {
    const queueInfo = await QueueService.getQueueInfo(req.params.centerId);
    if (!queueInfo) {
      return res.status(404).json({ success: false, message: 'Center not found' });
    }
    res.json({ success: true, data: queueInfo });
  } catch (error) {
    next(error);
  }
};

// @desc    Get queue position for a farmer's booking
// @route   GET /api/queue/position/:bookingId
exports.getQueuePosition = async (req, res, next) => {
  try {
    const position = await QueueService.getFarmerQueuePosition(req.params.bookingId);
    if (!position) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.json({ success: true, data: position });
  } catch (error) {
    next(error);
  }
};
