const mongoose = require('mongoose');

const generalFaqSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  keywords: [{ type: String }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('GeneralFaq', generalFaqSchema);
