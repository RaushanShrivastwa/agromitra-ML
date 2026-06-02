const mongoose = require('mongoose');

const contactQuerySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, default: "" },
  message: { type: String, required: true },
  answer: { type: String, default: "" },
  status: { type: String, default: 'Pending', enum: ['Pending', 'Answered'] },
  approvedForSearch: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ContactQuery', contactQuerySchema);
