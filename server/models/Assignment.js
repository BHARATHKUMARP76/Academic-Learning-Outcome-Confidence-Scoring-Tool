const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  totalMarks: { type: Number, required: true, min: 1 },
  dueDate: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
