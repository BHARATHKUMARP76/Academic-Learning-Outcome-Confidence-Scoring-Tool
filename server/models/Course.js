const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  learningOutcomes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'LearningOutcome' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Course', courseSchema);
