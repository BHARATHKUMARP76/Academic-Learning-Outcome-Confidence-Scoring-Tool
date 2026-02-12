const Submission = require('../models/Submission');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');

exports.studentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const submissions = await Submission.find({ student: studentId })
      .populate('assignment', 'title')
      .sort('submittedAt');
    const performancePerAssignment = submissions.map((s) => ({
      assignment: s.assignment?.title || 'Unknown',
      marks: s.marksObtained,
      percentage: s.performancePercentage,
      confidenceScore: s.calculatedConfidenceScore,
      strength: s.learningStrength,
      date: s.submittedAt
    }));
    const weak = submissions.filter((s) => s.learningStrength === 'Weak').length;
    const medium = submissions.filter((s) => s.learningStrength === 'Medium').length;
    const strong = submissions.filter((s) => s.learningStrength === 'Strong').length;
    const avgConfidence = submissions.length
      ? submissions.reduce((a, s) => a + s.calculatedConfidenceScore, 0) / submissions.length
      : 0;
    const trend = submissions.map((s) => ({
      date: s.submittedAt,
      score: s.calculatedConfidenceScore
    }));
    res.json({
      performancePerAssignment,
      distribution: { weak, medium, strong },
      avgConfidenceScore: Math.round(avgConfidence * 100) / 100,
      trend
    });
  } catch (error) {
    next(error);
  }
};

exports.courseAnalytics = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const assignments = await Assignment.find({ course: courseId }).select('_id title');
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      .populate('student', 'name')
      .populate('assignment', 'title');
    const byAssignment = assignments.map((a) => {
      const subs = submissions.filter((s) => s.assignment._id.toString() === a._id.toString());
      const avg = subs.length
        ? subs.reduce((sum, s) => sum + s.calculatedConfidenceScore, 0) / subs.length
        : 0;
      return { assignment: a.title, avgScore: Math.round(avg * 100) / 100, count: subs.length };
    });
    const weak = submissions.filter((s) => s.learningStrength === 'Weak').length;
    const medium = submissions.filter((s) => s.learningStrength === 'Medium').length;
    const strong = submissions.filter((s) => s.learningStrength === 'Strong').length;
    const weakAreas = submissions
      .filter((s) => s.learningStrength === 'Weak')
      .map((s) => ({ student: s.student?.name, assignment: s.assignment?.title }));
    res.json({
      byAssignment,
      distribution: { weak, medium, strong },
      weakAreas: weakAreas.slice(0, 20)
    });
  } catch (error) {
    next(error);
  }
};

exports.institutionAnalytics = async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const submissions = await Submission.find().populate('assignment');
    const avgConfidence =
      submissions.length
        ? submissions.reduce((a, s) => a + s.calculatedConfidenceScore, 0) / submissions.length
        : 0;
    const weakCount = submissions.filter((s) => s.learningStrength === 'Weak').length;
    const weakLearnerPercentage = submissions.length
      ? Math.round((weakCount / submissions.length) * 100)
      : 0;
    const trendByDate = {};
    submissions.forEach((s) => {
      const d = s.submittedAt.toISOString().split('T')[0];
      if (!trendByDate[d]) trendByDate[d] = { total: 0, sum: 0 };
      trendByDate[d].total += 1;
      trendByDate[d].sum += s.calculatedConfidenceScore;
    });
    const trend = Object.entries(trendByDate)
      .map(([date, v]) => ({ date, avgScore: v.sum / v.total }))
      .sort((a, b) => a.date.localeCompare(b.date));
    res.json({
      totalStudents,
      avgConfidenceScore: Math.round(avgConfidence * 100) / 100,
      weakLearnerPercentage,
      trend
    });
  } catch (error) {
    next(error);
  }
};
