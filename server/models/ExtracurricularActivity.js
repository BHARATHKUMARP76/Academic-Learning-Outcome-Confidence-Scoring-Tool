const mongoose = require('mongoose');

const extracurricularActivitySchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  eventName: { type: String, required: true, trim: true },
  eventType: { type: String, required: true, trim: true }, // Hackathon, Workshop, etc.
  dateOfParticipation: { type: Date, required: true },
  description: { type: String, trim: true },
  filePath: { type: String, required: true, trim: true },
  submittedAt: { type: Date, default: Date.now }
});

extracurricularActivitySchema.index({ student: 1, dateOfParticipation: -1 });

module.exports = mongoose.model('ExtracurricularActivity', extracurricularActivitySchema);

