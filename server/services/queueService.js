const Booking = require('../models/Booking');
const ProcurementCenter = require('../models/ProcurementCenter');

/**
 * Queue & Smart Advisor Service
 * Handles wait-time estimation, congestion levels, and slot recommendations
 */
class QueueService {
  /**
   * Get live queue info for a center
   */
  static async getQueueInfo(centerId, date = null) {
    const today = date || new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const center = await ProcurementCenter.findById(centerId);
    if (!center) return null;

    // Get active bookings for today
    const activeStatuses = ['checked-in', 'in-queue', 'called', 'weighing', 'quality-check', 'payment'];
    const activeBookings = await Booking.find({
      center: centerId,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: activeStatuses },
    }).sort({ queuePosition: 1 }).populate('farmer', 'farmerId').populate('user', 'name');

    const waitingCount = activeBookings.filter(
      (b) => ['checked-in', 'in-queue'].includes(b.status)
    ).length;

    const currentlyServing = activeBookings.find((b) => b.status === 'called') || null;

    // Average service time (minutes per farmer per counter)
    const avgServiceTime = await QueueService.getAverageServiceTime(centerId);

    // Estimated wait time
    const activeCounters = center.activeCounters || center.numberOfCounters;
    const estimatedWait = Math.ceil((waitingCount * avgServiceTime) / Math.max(activeCounters, 1));

    // Congestion level
    const congestion = QueueService.getCongestionLevel(waitingCount, center.dailyCapacity / 4); // per slot

    return {
      centerId,
      centerName: center.centerName,
      farmersWaiting: waitingCount,
      totalInProcess: activeBookings.length,
      currentlyServing: currentlyServing
        ? { tokenNumber: currentlyServing.tokenNumber, farmerName: currentlyServing.user?.name }
        : null,
      estimatedWaitMinutes: estimatedWait,
      congestionLevel: congestion.level,
      congestionColor: congestion.color,
      activeCounters,
      queue: activeBookings.map((b) => ({
        bookingId: b._id,
        tokenNumber: b.tokenNumber,
        farmerName: b.user?.name,
        farmerId: b.farmer?.farmerId,
        status: b.status,
        queuePosition: b.queuePosition,
        cropName: b.cropName,
      })),
    };
  }

  /**
   * Get queue position for a specific farmer's booking
   */
  static async getFarmerQueuePosition(bookingId) {
    const booking = await Booking.findById(bookingId);
    if (!booking) return null;

    const today = new Date(booking.date);
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const aheadCount = await Booking.countDocuments({
      center: booking.center,
      date: { $gte: today, $lt: tomorrow },
      status: { $in: ['checked-in', 'in-queue'] },
      queuePosition: { $lt: booking.queuePosition },
    });

    const center = await ProcurementCenter.findById(booking.center);
    const avgServiceTime = await QueueService.getAverageServiceTime(booking.center);
    const activeCounters = center?.activeCounters || center?.numberOfCounters || 1;
    const estimatedWait = Math.ceil((aheadCount * avgServiceTime) / activeCounters);

    const congestion = QueueService.getCongestionLevel(
      aheadCount,
      (center?.dailyCapacity || 100) / 4
    );

    return {
      bookingId,
      tokenNumber: booking.tokenNumber,
      status: booking.status,
      queuePosition: booking.queuePosition,
      farmersAhead: aheadCount,
      estimatedWaitMinutes: estimatedWait,
      congestionLevel: congestion.level,
      congestionColor: congestion.color,
    };
  }

  /**
   * Get average service time for a center (in minutes)
   */
  static async getAverageServiceTime(centerId) {
    const Procurement = require('../models/Procurement');
    const recent = await Procurement.find({ center: centerId })
      .sort({ createdAt: -1 })
      .limit(50)
      .select('stageDurations');

    if (recent.length === 0) return 15; // default 15 minutes

    const total = recent.reduce((sum, p) => sum + (p.stageDurations?.total || 15), 0);
    return Math.ceil(total / recent.length);
  }

  /**
   * Determine congestion level
   */
  static getCongestionLevel(waiting, slotCapacity) {
    const ratio = waiting / Math.max(slotCapacity, 1);

    if (ratio < 0.5) return { level: 'Low', color: '#22c55e' };
    if (ratio < 0.8) return { level: 'Medium', color: '#f59e0b' };
    return { level: 'High', color: '#ef4444' };
  }

  /**
   * Smart Advisor — recommend the least crowded slot
   */
  static async recommendSlot(centerId, date) {
    const Slot = require('../models/Slot');

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const slots = await Slot.find({
      center: centerId,
      date: { $gte: startOfDay, $lt: endOfDay },
      isAvailable: true,
    }).sort({ currentBookings: 1 });

    if (slots.length === 0) return null;

    // Find the slot with the most remaining capacity
    const best = slots.reduce((prev, curr) => {
      const prevRemaining = prev.maxCapacity - prev.currentBookings;
      const currRemaining = curr.maxCapacity - curr.currentBookings;
      return currRemaining > prevRemaining ? curr : prev;
    });

    return {
      slotId: best._id,
      timeSlot: best.timeSlot,
      remainingCapacity: best.maxCapacity - best.currentBookings,
      congestion: QueueService.getCongestionLevel(best.currentBookings, best.maxCapacity),
      recommendation: `Best time to visit: ${best.timeSlot.start} - ${best.timeSlot.end} (${best.maxCapacity - best.currentBookings} spots available)`,
    };
  }
}

module.exports = QueueService;
