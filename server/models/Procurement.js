const mongoose = require('mongoose');

const procurementSchema = new mongoose.Schema({
  booking: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true,
  },
  farmer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Farmer',
    required: true,
  },
  center: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProcurementCenter',
    required: true,
  },
  cropName: {
    type: String,
    required: true,
  },
  declaredWeight: {
    type: Number, // quintals
    required: true,
  },
  actualWeight: {
    type: Number, // quintals
    default: null,
  },
  qualityGrade: {
    type: String,
    enum: ['A', 'B', 'C', null],
    default: null,
  },
  ratePerQuintal: {
    type: Number,
    default: null,
  },
  totalAmount: {
    type: Number,
    default: null,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processed'],
    default: 'pending',
  },
  paymentDate: {
    type: Date,
    default: null,
  },
  stageDurations: {
    checkIn: { type: Number, default: 0 },     // minutes
    weighing: { type: Number, default: 0 },
    qualityCheck: { type: Number, default: 0 },
    payment: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
}, {
  timestamps: true,
});

procurementSchema.index({ center: 1, createdAt: -1 });

module.exports = mongoose.model('Procurement', procurementSchema);
