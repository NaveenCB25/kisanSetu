const mongoose = require('mongoose');

const cropRateSchema = new mongoose.Schema({
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
  mspRate: {
    type: Number, // per quintal in INR
    required: true,
    min: 0,
  },
  gradeARate: {
    type: Number,
    required: true,
  },
  gradeBRate: {
    type: Number,
    required: true,
  },
  gradeCRate: {
    type: Number,
    required: true,
  },
  season: {
    type: String,
    enum: ['kharif', 'rabi', 'zaid', 'all'],
    default: 'all',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

cropRateSchema.index({ cropCategory: 1, cropName: 1 }, { unique: true });

module.exports = mongoose.model('CropRate', cropRateSchema);
