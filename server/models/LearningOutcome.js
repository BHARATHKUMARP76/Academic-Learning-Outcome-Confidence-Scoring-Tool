const mongoose = require('mongoose');

const learningOutcomeSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('LearningOutcome', learningOutcomeSchema);
