const mongoose = require('mongoose');

const quizAttemptSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    quiz_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true
    },
    answers: [
      {
        questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
        selectedOption: { type: String, trim: true, default: '' }
      }
    ],
    score: { type: Number, required: true, min: 0 },
    submitted_at: { type: Date, default: Date.now }
  },
  {
    collection: 'quiz_attempts'
  }
);

quizAttemptSchema.index({ student_id: 1, quiz_id: 1 }, { unique: true });

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
