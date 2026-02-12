const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignment: { type: mongoose.Schema.Types.ObjectId, ref: 'Assignment', required: true },
  marksObtained: { type: Number, required: true, min: 0 },
  confidenceLevel: { type: Number, required: true, min: 1, max: 5 },
  performancePercentage: { type: Number },
  calculatedConfidenceScore: { type: Number },
  learningStrength: { type: String, enum: ['Weak', 'Medium', 'Strong'] },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Submission', submissionSchema);
