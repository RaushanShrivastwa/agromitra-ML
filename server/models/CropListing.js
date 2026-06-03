const mongoose = require('mongoose');

const cropListingSchema = new mongoose.Schema({
  cropName: { type: String, required: true },
  category: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: "" },
  categoryImageUrl: { type: String, default: "" },
  farmerName: { type: String, required: true },
  farmerPhone: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  approvalStatus: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CropListing', cropListingSchema);
