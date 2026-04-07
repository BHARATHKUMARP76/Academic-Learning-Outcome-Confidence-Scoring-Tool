const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true }, // certificate title
  platform: { type: String, required: true, trim: true }, // Coursera, NPTEL, etc.
  description: { type: String, trim: true },
  filePath: { type: String, required: true, trim: true },
  submittedAt: { type: Date, default: Date.now }
});

achievementSchema.index({ student: 1, submittedAt: -1 });

module.exports = mongoose.model('Achievement', achievementSchema);

