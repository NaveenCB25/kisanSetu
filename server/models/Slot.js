const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementCenter',
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  timeSlot: {
    start: { type: String, required: true }, // e.g. "08:00"
    end: { type: String, required: true },   // e.g. "10:00"
  },
  maxCapacity: {
    type: Number,
    required: true,
    default: 20,
  },
  currentBookings: {
    type: Number,
    default: 0,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

slotSchema.index({ center: 1, date: 1, 'timeSlot.start': 1 }, { unique: true });

slotSchema.virtual('remainingCapacity').get(function() {
  return this.maxCapacity - this.currentBookings;
});

slotSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Slot', slotSchema);
