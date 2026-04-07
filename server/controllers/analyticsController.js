const Submission = require('../models/Submission');
const User = require('../models/User');
const Course = require('../models/Course');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');

exports.studentAnalytics = async (req, res, next) => {
  try {
    const studentId = req.params.id;
    if (req.user.role === 'student' && req.user._id.toString() !== studentId) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    const submissions = await Submission.find({ student: studentId })
      .populate('assignment', 'title type totalMarks')
      .sort('submittedAt');
    const performancePerAssignment = submissions.map((s) => ({
      assignment: s.assignment?.title || 'Unknown',
      type: s.assignment?.type || 'assignment',
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
      ? submissions.reduce((a, s) => a + (s.calculatedConfidenceScore || 0), 0) / submissions.length
      : 0;

    const avgAttendance = submissions.length
      ? submissions.reduce((a, s) => a + (s.attendancePercentage != null ? s.attendancePercentage : 0), 0) /
        submissions.length
      : 0;
    const trend = submissions.map((s) => ({
      date: s.submittedAt ? s.submittedAt.toISOString().split('T')[0] : null,
      score: s.calculatedConfidenceScore
    }));
    const attendanceTrend = submissions.map((s) => ({
      date: s.submittedAt ? s.submittedAt.toISOString().split('T')[0] : null,
      attendance: s.attendancePercentage != null ? s.attendancePercentage : 0
    }));
    const assignmentVsQuiz = {
      assignment: submissions.filter((s) => s.assignment?.type === 'assignment'),
      quiz: submissions.filter((s) => s.assignment?.type === 'quiz')
    };
    const assignmentVsQuizPerformance = [
      {
        type: 'Assignment',
        avgScore: assignmentVsQuiz.assignment.length
          ? assignmentVsQuiz.assignment.reduce((a, s) => a + (s.calculatedConfidenceScore || 0), 0) /
            assignmentVsQuiz.assignment.length
          : 0,
        count: assignmentVsQuiz.assignment.length
      },
      {
        type: 'Quiz',
        avgScore: assignmentVsQuiz.quiz.length
          ? assignmentVsQuiz.quiz.reduce((a, s) => a + (s.calculatedConfidenceScore || 0), 0) /
            assignmentVsQuiz.quiz.length
          : 0,
        count: assignmentVsQuiz.quiz.length
      }
    ];

    // MCQ accuracy (per quiz for this student) based on performance percentage
    const mcqAccuracy = submissions
      .filter((s) => s.assignment?.type === 'quiz')
      .map((s) => ({
        assignment: s.assignment?.title || 'Quiz',
        accuracy: s.performancePercentage != null ? s.performancePercentage : 0,
        date: s.submittedAt
      }));
    const outcomeAnalysis = submissions
      .filter((s) => s.assignment?.type === 'quiz' && s.outcomeAnalysis)
      .map((s) => ({
        assignment: s.assignment?.title || 'Quiz',
        date: s.submittedAt,
        quizScore:
          s.outcomeAnalysis?.quizScore != null
            ? s.outcomeAnalysis.quizScore
            : s.performancePercentage != null
              ? s.performancePercentage
              : 0,
        confidenceScore:
          s.outcomeAnalysis?.confidenceScore != null
            ? s.outcomeAnalysis.confidenceScore
            : s.calculatedConfidenceScore || 0,
        attendance:
          s.outcomeAnalysis?.attendance != null
            ? s.outcomeAnalysis.attendance
            : s.attendancePercentage != null
              ? s.attendancePercentage
              : 0,
        learningOutcomeLevel: s.outcomeAnalysis?.learningOutcomeLevel || 'Low Confidence',
        weakTopics: Array.isArray(s.outcomeAnalysis?.weakTopics) ? s.outcomeAnalysis.weakTopics : [],
        recommendation:
          s.outcomeAnalysis?.recommendation ||
          'Student should review the topic and practice additional exercises.'
      }))
      .sort((a, b) => new Date(b.date) - new Date(a.date));
    const allAchievements = submissions.reduce((acc, s) => acc.concat(s.achievements || []), []);
    res.json({
      performancePerAssignment,
      distribution: { weak, medium, strong },
      avgConfidenceScore: Math.round(avgConfidence * 100) / 100,
      avgAttendance: Math.round(avgAttendance * 100) / 100,
      trend,
      attendanceTrend,
      assignmentVsQuizPerformance,
      mcqAccuracy,
      outcomeAnalysis,
      achievements: [...new Set(allAchievements)]
    });
  } catch (error) {
    next(error);
  }
};

exports.courseAnalytics = async (req, res, next) => {
  try {
    const courseId = req.params.id;
    const assignments = await Assignment.find({ course: courseId }).select('_id title type');
    const assignmentIds = assignments.map((a) => a._id);
    const submissions = await Submission.find({ assignment: { $in: assignmentIds } })
      .populate('student', 'name email')
      .populate('assignment', 'title type totalMarks');
    const byAssignment = assignments.map((a) => {
      const subs = submissions.filter((s) => s.assignment && s.assignment._id.toString() === a._id.toString());
      const avg = subs.length
        ? subs.reduce((sum, s) => sum + (s.calculatedConfidenceScore || 0), 0) / subs.length
        : 0;
      return { assignment: a.title, type: a.type, avgScore: Math.round(avg * 100) / 100, count: subs.length };
    });
    const weak = submissions.filter((s) => s.learningStrength === 'Weak').length;
    const medium = submissions.filter((s) => s.learningStrength === 'Medium').length;
    const strong = submissions.filter((s) => s.learningStrength === 'Strong').length;
    const weakAreas = submissions
      .filter((s) => s.learningStrength === 'Weak')
      .map((s) => ({ student: s.student?.name, assignment: s.assignment?.title, marks: s.marksObtained, attendancePercentage: s.attendancePercentage, achievements: s.achievements, extracurricularActivities: s.extracurricularActivities }));
    const attendanceByDate = {};
    let attendanceSum = 0;
    let attendanceCount = 0;
    submissions.forEach((s) => {
      const perc = s.attendancePercentage != null ? s.attendancePercentage : 0;
      attendanceSum += perc;
      attendanceCount += 1;
      const d = s.submittedAt ? s.submittedAt.toISOString().split('T')[0] : null;
      if (d) {
        if (!attendanceByDate[d]) attendanceByDate[d] = { sum: 0, count: 0 };
        attendanceByDate[d].sum += perc;
        attendanceByDate[d].count += 1;
      }
    });
    const attendanceTrend = Object.entries(attendanceByDate)
      .map(([date, v]) => ({ date, attendance: v.count ? v.sum / v.count : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const avgAttendance = attendanceCount ? attendanceSum / attendanceCount : 0;
    const assignmentSubs = submissions.filter((s) => s.assignment && s.assignment.type === 'assignment');
    const quizSubs = submissions.filter((s) => s.assignment && s.assignment.type === 'quiz');
    const assignmentVsQuizPerformance = [
      {
        type: 'Assignment',
        avgScore: assignmentSubs.length
          ? assignmentSubs.reduce((a, s) => a + (s.calculatedConfidenceScore || 0), 0) / assignmentSubs.length
          : 0,
        count: assignmentSubs.length
      },
      {
        type: 'Quiz',
        avgScore: quizSubs.length
          ? quizSubs.reduce((a, s) => a + (s.calculatedConfidenceScore || 0), 0) / quizSubs.length
          : 0,
        count: quizSubs.length
      }
    ];

    // MCQ accuracy per quiz for this course (average performancePercentage across submissions)
    const quizAssignments = assignments.filter((a) => a.type === 'quiz');
    const mcqAccuracy = quizAssignments.map((a) => {
      const subs = submissions.filter(
        (s) => s.assignment && s.assignment._id.toString() === a._id.toString()
      );
      const avgPerf = subs.length
        ? subs.reduce((sum, s) => sum + (s.performancePercentage != null ? s.performancePercentage : 0), 0) /
          subs.length
        : 0;
      return {
        assignment: a.title,
        accuracy: avgPerf
      };
    });
    const confidenceTrend = {};
    submissions.forEach((s) => {
      const d = s.submittedAt ? s.submittedAt.toISOString().split('T')[0] : null;
      if (d) {
        if (!confidenceTrend[d]) confidenceTrend[d] = { sum: 0, count: 0 };
        confidenceTrend[d].sum += s.calculatedConfidenceScore || 0;
        confidenceTrend[d].count += 1;
      }
    });
    const confidenceTrendData = Object.entries(confidenceTrend)
      .map(([date, v]) => ({ date, avgScore: v.count ? v.sum / v.count : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const allAchievements = submissions.reduce((acc, s) => acc.concat(s.achievements || []), []);
    res.json({
      byAssignment,
      distribution: { weak, medium, strong },
      weakAreas: weakAreas.slice(0, 20),
      weakLearners: weakAreas,
      attendanceTrend,
      assignmentVsQuizPerformance,
      confidenceTrend: confidenceTrendData,
      avgAttendance: Math.round(avgAttendance * 100) / 100,
      mcqAccuracy,
      achievements: [...new Set(allAchievements)],
      submissionsWithDetails: submissions.slice(0, 50).map((s) => ({
        student: s.student?.name,
        assignment: s.assignment?.title,
        marks: s.marksObtained,
        attendancePercentage: s.attendancePercentage,
        achievements: s.achievements,
        extracurricularActivities: s.extracurricularActivities,
        confidenceScore: s.calculatedConfidenceScore,
        learningStrength: s.learningStrength
      }))
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
        ? submissions.reduce((a, s) => a + (s.calculatedConfidenceScore || 0), 0) / submissions.length
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
      trendByDate[d].sum += s.calculatedConfidenceScore || 0;
    });
    const trend = Object.entries(trendByDate)
      .map(([date, v]) => ({ date, avgScore: v.sum / v.total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const attendanceByDate = {};
    let attendanceSum = 0;
    let attendanceCount = 0;
    submissions.forEach((s) => {
      const perc = s.attendancePercentage != null ? s.attendancePercentage : 0;
      attendanceSum += perc;
      attendanceCount += 1;
      const d = s.submittedAt.toISOString().split('T')[0];
      if (!attendanceByDate[d]) attendanceByDate[d] = { sum: 0, count: 0 };
      attendanceByDate[d].sum += perc;
      attendanceByDate[d].count += 1;
    });
    const attendanceTrend = Object.entries(attendanceByDate)
      .map(([date, v]) => ({ date, attendance: v.count ? v.sum / v.count : 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const avgAttendance = attendanceCount ? attendanceSum / attendanceCount : 0;

    const distribution = {
      weak: submissions.filter((s) => s.learningStrength === 'Weak').length,
      medium: submissions.filter((s) => s.learningStrength === 'Medium').length,
      strong: submissions.filter((s) => s.learningStrength === 'Strong').length
    };

    const allAchievements = submissions.reduce((acc, s) => acc.concat(s.achievements || []), []);

    const quizSubs = submissions.filter((s) => s.assignment && s.assignment.type === 'quiz');
    const mcqAccuracy = quizSubs.length
      ? quizSubs.reduce(
          (sum, s) => sum + (s.performancePercentage != null ? s.performancePercentage : 0),
          0
        ) / quizSubs.length
      : 0;

    res.json({
      totalStudents,
      avgConfidenceScore: Math.round(avgConfidence * 100) / 100,
      weakLearnerPercentage,
      trend,
      attendanceTrend,
      distribution,
      avgAttendance: Math.round(avgAttendance * 100) / 100,
      achievementCount: allAchievements.length,
      achievements: [...new Set(allAchievements)],
      mcqAccuracy
    });
  } catch (error) {
    next(error);
  }
};
