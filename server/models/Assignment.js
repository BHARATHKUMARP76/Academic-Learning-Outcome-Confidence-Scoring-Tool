const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  type: {
    type: String,
    enum: ['assignment', 'quiz'],
    required: true,
    default: 'assignment'
  },
  totalMarks: { type: Number, required: true, min: 1 },
  dueDate: { type: Date, required: true },
  correctAnswer: { type: String, trim: true },
  questions: [
    {
      questionText: { type: String, required: true, trim: true },
      options: [{ type: String, required: true, trim: true }],
      correctAnswer: { type: String, required: true, trim: true },
      marks: { type: Number, required: true, min: 0 },
      learningOutcome: { type: mongoose.Schema.Types.ObjectId, ref: 'LearningOutcome' }
    }
  ],
  assignedStudents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Assignment', assignmentSchema);
