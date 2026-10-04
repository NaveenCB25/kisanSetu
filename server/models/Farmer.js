const mongoose = require('mongoose');

const farmerSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  farmerId: {
    type: String,
    unique: true,
  },
  village: {
    type: String,
    required: [true, 'Village is required'],
    trim: true,
  },
  district: {
    type: String,
    required: [true, 'District is required'],
    trim: true,
  },
  landSize: {
    type: Number,
    required: [true, 'Land size is required'],
    min: 0,
  },
  landUnit: {
    type: String,
    enum: ['acres', 'hectares', 'bigha'],
    default: 'acres',
  },
  mainCrops: [{
    type: String,
    trim: true,
  }],
  aadhaarVerified: {
    type: Boolean,
    default: false, // Placeholder — future scope
  },
}, {
  timestamps: true,
});

// Auto-generate farmerId
farmerSchema.pre('save', async function(next) {
  if (!this.farmerId) {
    const count = await mongoose.model('Farmer').countDocuments();
    this.farmerId = `KS-F${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Farmer', farmerSchema);
