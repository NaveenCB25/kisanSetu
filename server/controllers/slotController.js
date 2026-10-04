const Slot = require('../models/Slot');
const ProcurementCenter = require('../models/ProcurementCenter');

// @desc    Get available slots for a center on a date
// @route   GET /api/slots/:centerId/:date
exports.getSlots = async (req, res, next) => {
  try {
    const { centerId, date } = req.params;

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    let slots = await Slot.find({
      center: centerId,
      date: { $gte: startOfDay, $lt: endOfDay },
    }).sort({ 'timeSlot.start': 1 });

    // Auto-generate slots if none exist for that day
    if (slots.length === 0) {
      const center = await ProcurementCenter.findById(centerId);
      if (!center || center.status !== 'approved') {
        return res.status(404).json({ success: false, message: 'Center not found or not approved' });
      }

      const generatedSlots = [];
      const startHour = parseInt(center.operatingHours.start.split(':')[0]);
      const endHour = parseInt(center.operatingHours.end.split(':')[0]);
      const slotDuration = 2; // 2-hour slots
      const slotsPerDay = Math.floor((endHour - startHour) / slotDuration);
      const capacityPerSlot = Math.ceil(center.dailyCapacity / slotsPerDay / 5); // ~farmers per slot

      for (let i = 0; i < slotsPerDay; i++) {
        const slotStart = `${String(startHour + i * slotDuration).padStart(2, '0')}:00`;
        const slotEnd = `${String(startHour + (i + 1) * slotDuration).padStart(2, '0')}:00`;

        generatedSlots.push({
          center: centerId,
          date: startOfDay,
          timeSlot: { start: slotStart, end: slotEnd },
          maxCapacity: Math.max(capacityPerSlot, 10),
          currentBookings: 0,
          isAvailable: true,
        });
      }

      slots = await Slot.insertMany(generatedSlots);
    }

    res.json({ success: true, data: slots });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all approved centers (for slot booking dropdown)
// @route   GET /api/slots/centers
exports.getApprovedCenters = async (req, res, next) => {
  try {
    const centers = await ProcurementCenter.find({
      status: 'approved',
      isActive: true,
    }).select('centerName centerCode address district cropsHandled dailyCapacity operatingHours');

    res.json({ success: true, data: centers });
  } catch (error) {
    next(error);
  }
};
