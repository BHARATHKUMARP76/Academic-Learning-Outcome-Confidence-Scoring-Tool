const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');

function getLearningStrength(score) {
  if (score < 50) return 'Weak';
  if (score <= 75) return 'Medium';
  return 'Strong';
}

exports.createSubmission = async (req, res, next) => {
  try {
    const { assignment, marksObtained, confidenceLevel } = req.body;
    const assignmentDoc = await Assignment.findById(assignment);
    if (!assignmentDoc) return res.status(404).json({ message: 'Assignment not found' });
    const existing = await Submission.findOne({ student: req.user._id, assignment });
    if (existing) return res.status(400).json({ message: 'Already submitted for this assignment' });

    const performancePercentage = (marksObtained / assignmentDoc.totalMarks) * 100;
    const calculatedConfidenceScore = (performancePercentage * confidenceLevel) / 5;
    const learningStrength = getLearningStrength(calculatedConfidenceScore);

    const submission = await Submission.create({
      student: req.user._id,
      assignment,
      marksObtained,
      confidenceLevel,
      performancePercentage,
      calculatedConfidenceScore,
      learningStrength
    });

    await Notification.create({
      user: req.user._id,
      title: 'Submission Successful',
      message: 'Your submission has been recorded.',
      type: 'submission_success',
      link: '/submissions'
    });

    const populated = await Submission.findById(submission._id)
      .populate('assignment', 'title totalMarks')
      .populate('student', 'name email');
    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
};

exports.getSubmissionsByStudent = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const submissions = await Submission.find({ student: studentId })
      .populate('assignment', 'title totalMarks course')
      .sort('-submittedAt');
    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

exports.getSubmissionsByCourse = async (req, res, next) => {
  try {
    const Assignment = require('../models/Assignment');
    const assignments = await Assignment.find({ course: req.params.id }).select('_id');
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      .populate('student', 'name email')
      .populate('assignment', 'title totalMarks')
      .sort('-submittedAt');
    res.json(submissions);
  } catch (error) {
    next(error);
  }
};

exports.getSubmissionById = async (req, res, next) => {
  try {
    const submission = await Submission.findById(req.params.id)
      .populate('student', 'name email')
      .populate('assignment', 'title totalMarks course');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(submission);
  } catch (error) {
    next(error);
  }
};
