const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  // Free-text answer for traditional assignments
  answer: { type: String, trim: true },
  // MCQ answers for quiz-type assignments (one entry per question)
  answers: [
    {
      questionId: { type: mongoose.Schema.Types.ObjectId },
      selectedOption: { type: String, trim: true }
    }
  ],
  marksObtained: { type: Number, min: 0 },
  confidenceLevel: { type: Number, required: true, min: 1, max: 5 },
  attendancePercentage: { type: Number, min: 0, max: 100, default: 0 },
  achievements: [{ type: String, trim: true }],
  extracurricularActivities: [{ type: String, trim: true }],
  performancePercentage: { type: Number },
  calculatedConfidenceScore: { type: Number },
  learningStrength: { type: String, enum: ['Weak', 'Medium', 'Strong'] },
  outcomeAnalysis: {
    quizScore: { type: Number, min: 0, max: 100 },
    attendance: { type: Number, min: 0, max: 100 },
    confidenceScore: { type: Number, min: 0, max: 100 },
    learningOutcomeLevel: {
      type: String,
      enum: ['High Confidence', 'Medium Confidence', 'Low Confidence']
    },
    weakTopics: [{ type: String, trim: true }],
    recommendation: { type: String, trim: true },
    generatedAt: { type: Date, default: Date.now }
  },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);
