const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementCenter',
    required: true,
  },
  slot: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: true,
  },
  tokenNumber: {
    type: String,
    unique: true,
  },
  cropCategory: {
    type: String,
    required: true,
    trim: true,
  },
  cropName: {
    type: String,
    required: true,
    trim: true,
  },
  declaredQuantity: {
    type: Number, // in quintals
    required: true,
    min: 0.1,
  },
  status: {
    type: String,
    enum: ['booked', 'checked-in', 'in-queue', 'called', 'weighing', 'quality-check', 'payment', 'completed', 'cancelled', 'no-show'],
    default: 'booked',
  },
  queuePosition: {
    type: Number,
    default: null,
  },
  stageTimestamps: {
    booked: { type: Date, default: Date.now },
    checkedIn: Date,
    inQueue: Date,
    called: Date,
    weighing: Date,
    qualityCheck: Date,
    payment: Date,
    completed: Date,
    cancelled: Date,
    noShow: Date,
  },
  date: {
    type: Date,
    required: true,
  },
}, {
  timestamps: true,
});

// Auto-generate token number
bookingSchema.pre('save', async function(next) {
  if (!this.tokenNumber) {
    const dateStr = new Date(this.date || Date.now()).toISOString().slice(2, 10).replace(/-/g, '');
    const centerSuffix = this.center ? String(this.center).slice(-3).toUpperCase() : '001';
    const count = await mongoose.model('Booking').countDocuments({
      center: this.center,
      date: this.date,
    });
    this.tokenNumber = `TKN-${dateStr}-${centerSuffix}-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

bookingSchema.index({ farmer: 1, date: 1 });
bookingSchema.index({ center: 1, date: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
