const mongoose = require('mongoose');

const procurementCenterSchema = new mongoose.Schema({
  centerName: {
    type: String,
    required: [true, 'Center name is required'],
    trim: true,
  },
  centerCode: {
    type: String,
    required: [true, 'Center code is required'],
    unique: true,
    uppercase: true,
    trim: true,
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
  },
  numberOfCounters: {
    type: Number,
    required: true,
    min: 1,
    default: 2,
  },
  dailyCapacity: {
    type: Number, // in quintals
    required: true,
    min: 1,
  },
  operatingHours: {
    start: { type: String, default: '08:00' },
    end: { type: String, default: '17:00' },
  },
  cropsHandled: [{
    type: String,
    trim: true,
  }],
  operator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'inactive'],
    default: 'pending',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  activeCounters: {
    type: Number,
    default: 2,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('ProcurementCenter', procurementCenterSchema);
