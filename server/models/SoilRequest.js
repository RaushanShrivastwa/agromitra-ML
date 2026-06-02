const mongoose = require('mongoose');

const soilRequestSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    type: String,
    required: true
  },
  collectionDate: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Collected', 'Analyzing', 'Completed'],
    default: 'Pending'
  },
  // Soil test parameters (filled in by admin when complete)
  nitrogen: { type: Number, default: null },
  phosphorous: { type: Number, default: null },
  potassium: { type: Number, default: null },
  ph: { type: Number, default: null },
  moisture: { type: Number, default: null },
  soilType: { type: String, default: null },
  cropType: { type: String, default: null },
  temperature: { type: Number, default: null },
  humidity: { type: Number, default: null },
  remarks: { type: String, default: null },
  reportDate: { type: Date, default: null }
});

module.exports = mongoose.model('SoilRequest', soilRequestSchema);
