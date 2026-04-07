const Submission = require('../models/Submission');
const Assignment = require('../models/Assignment');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');
const QuizAttempt = require('../models/QuizAttempt');
const LearningOutcome = require('../models/LearningOutcome');

function getLearningStrength(score) {
  if (score < 50) return 'Weak';
  if (score <= 75) return 'Medium';
  return 'Strong';
}

function deriveConfidenceLevelFromPercentage(percentage) {
  if (percentage <= 20) return 1;
  if (percentage <= 40) return 2;
  if (percentage <= 60) return 3;
  if (percentage <= 80) return 4;
  return 5;
}

function computeAssignmentMarks(assignmentDoc, answer) {
  const total = assignmentDoc.totalMarks || 1;
  if (!assignmentDoc.correctAnswer || answer == null || String(answer).trim() === '') {
    return 0;
  }
  const correct = String(assignmentDoc.correctAnswer).trim().toLowerCase();
  const studentAnswer = String(answer).trim().toLowerCase();
  return correct === studentAnswer ? total : 0;
}

function computeQuizMarks(assignmentDoc, answers) {
  if (!Array.isArray(assignmentDoc.questions) || assignmentDoc.questions.length === 0) {
    return 0;
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return 0;
  }

  const answerMap = new Map();
  answers.forEach((a) => {
    if (!a || !a.questionId) return;
    const key = String(a.questionId);
    const selected =
      a.selectedOption != null ? String(a.selectedOption).trim().toLowerCase() : '';
    answerMap.set(key, selected);
  });

  let obtained = 0;
  assignmentDoc.questions.forEach((q) => {
    const qId = String(q._id);
    const selected = answerMap.get(qId);
    if (!selected) return;
    const correct = (q.correctAnswer || '').trim().toLowerCase();
    if (correct && selected === correct) {
      obtained += q.marks || 0;
    }
  });

  return obtained;
}

function countCorrectAnswers(assignmentDoc, answers) {
  if (!Array.isArray(assignmentDoc.questions) || assignmentDoc.questions.length === 0) {
    return { correctCount: 0, totalQuestions: 0 };
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return { correctCount: 0, totalQuestions: assignmentDoc.questions.length };
  }

  const answerMap = new Map();
  answers.forEach((a) => {
    if (!a || !a.questionId) return;
    const key = String(a.questionId);
    const selected =
      a.selectedOption != null ? String(a.selectedOption).trim().toLowerCase() : '';
    answerMap.set(key, selected);
  });

  let correctCount = 0;
  assignmentDoc.questions.forEach((q) => {
    const qId = String(q._id);
    const selected = answerMap.get(qId);
    if (!selected) return;
    const correct = (q.correctAnswer || '').trim().toLowerCase();
    if (correct && selected === correct) {
      correctCount += 1;
    }
  });

  return { correctCount, totalQuestions: assignmentDoc.questions.length };
}

function getOutcomeLevelFromConfidence(confidenceScore) {
  if (confidenceScore >= 80) return 'High Confidence';
  if (confidenceScore >= 60) return 'Medium Confidence';
  return 'Low Confidence';
}

function getRecommendationFromConfidence(confidenceScore) {
  if (confidenceScore < 60) {
    return 'Student should review the topic and practice additional exercises.';
  }
  if (confidenceScore >= 80) {
    return 'Student demonstrates strong understanding of the subject.';
  }
  return 'Student is progressing well; targeted revision on weak areas is recommended.';
}

async function buildQuizOutcomeAnalysis(assignmentDoc, answers, scorePercentage, confidenceScore, attendancePercentage) {
  const answerMap = new Map();
  (answers || []).forEach((a) => {
    if (!a || !a.questionId) return;
    answerMap.set(
      String(a.questionId),
      a.selectedOption != null ? String(a.selectedOption).trim().toLowerCase() : ''
    );
  });

  const learningOutcomeIds = new Set();
  (assignmentDoc.questions || []).forEach((q) => {
    if (q && q.learningOutcome) learningOutcomeIds.add(String(q.learningOutcome));
  });

  let learningOutcomeTitleMap = new Map();
  if (learningOutcomeIds.size > 0) {
    const loDocs = await LearningOutcome.find({ _id: { $in: Array.from(learningOutcomeIds) } }).select('title');
    learningOutcomeTitleMap = new Map(loDocs.map((lo) => [String(lo._id), lo.title]));
  }

  const weakTopicsSet = new Set();
  (assignmentDoc.questions || []).forEach((q, index) => {
    const qId = String(q._id);
    const selected = answerMap.get(qId);
    const correct = (q.correctAnswer || '').trim().toLowerCase();
    if (!selected || selected !== correct) {
      const topicFromLO = q.learningOutcome ? learningOutcomeTitleMap.get(String(q.learningOutcome)) : '';
      const topic = topicFromLO || q.questionText || `Topic ${index + 1}`;
      weakTopicsSet.add(String(topic).trim());
    }
  });

  return {
    quizScore: scorePercentage,
    attendance: attendancePercentage,
    confidenceScore,
    learningOutcomeLevel: getOutcomeLevelFromConfidence(confidenceScore),
    weakTopics: Array.from(weakTopicsSet).filter(Boolean),
    recommendation: getRecommendationFromConfidence(confidenceScore),
    generatedAt: new Date()
  };
}

exports.createSubmission = async (req, res, next) => {
  try {
    const {
      assignment: assignmentId,
      answer,
      answers = [],
      confidenceLevel,
      achievements = [],
      extracurricularActivities = []
    } = req.body;

    if (req.body.marksObtained != null) {
      return res.status(400).json({ message: 'Marks cannot be submitted; they are calculated by the system.' });
    }
    if (req.body.attendancePercentage != null) {
      return res.status(400).json({ message: 'Attendance cannot be submitted; it is managed by faculty.' });
    }
    if (req.body.performancePercentage != null || req.body.calculatedConfidenceScore != null || req.body.learningStrength != null) {
      return res.status(400).json({ message: 'Calculated fields cannot be submitted; they are computed by the system.' });
    }
    const assignmentDoc = await Assignment.findById(assignmentId).populate('course');
    if (!assignmentDoc) return res.status(404).json({ message: 'Assignment not found' });
    const isQuiz = assignmentDoc.type === 'quiz';

    if (!isQuiz) {
      const existing = await Submission.findOne({ student: req.user._id, assignment: assignmentId });
      if (existing) return res.status(400).json({ message: 'Already submitted for this assignment' });
    }

    const courseId = assignmentDoc.course && (assignmentDoc.course._id || assignmentDoc.course);
    let attendancePercentage = 0;
    const attendanceRecord = await Attendance.findOne({ student: req.user._id, course: courseId });
    if (attendanceRecord) attendancePercentage = attendanceRecord.percentage;

    let marksObtained = 0;
    let storedAnswers = [];
    let performancePercentage = 0;
    let quizMeta = null;
    let outcomeAnalysis = null;

    if (assignmentDoc.type === 'quiz') {
      const assignedStudents = Array.isArray(assignmentDoc.assignedStudents) ? assignmentDoc.assignedStudents : [];
      if (!assignedStudents.some((studentId) => String(studentId) === String(req.user._id))) {
        return res.status(403).json({ message: 'This quiz is not assigned to you.' });
      }

      const existingQuizAttempt = await QuizAttempt.findOne({
        student_id: req.user._id,
        quiz_id: assignmentId
      });
      if (existingQuizAttempt) {
        return res.status(400).json({
          message: 'You have already attempted this quiz. Multiple submissions are not allowed.'
        });
      }

      if (!Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Quiz submissions must include selected answers.' });
      }
      if (answer != null && String(answer).trim() !== '') {
        return res.status(400).json({ message: 'Quiz submissions must not include a text answer.' });
      }
      const { correctCount, totalQuestions } = countCorrectAnswers(assignmentDoc, answers);
      marksObtained = correctCount; // score = number of correct answers
      performancePercentage = totalQuestions ? (correctCount / totalQuestions) * 100 : 0;
      quizMeta = { correctCount, totalQuestions, performancePercentage };

      storedAnswers = answers
        .filter((a) => a && a.questionId)
        .map((a) => ({
          questionId: a.questionId,
          selectedOption: a.selectedOption != null ? String(a.selectedOption).trim() : ''
        }));
    } else {
      if (Array.isArray(answers) && answers.length > 0) {
        return res.status(400).json({ message: 'Assignment submissions must not include MCQ answers.' });
      }
      marksObtained = computeAssignmentMarks(assignmentDoc, answer);
      const totalMarks = assignmentDoc.totalMarks || 1;
      performancePercentage = totalMarks ? (marksObtained / totalMarks) * 100 : 0;
    }

    let effectiveConfidenceLevel;
    if (assignmentDoc.type === 'quiz') {
      // For quizzes, confidence level is derived from score percentage
      effectiveConfidenceLevel = deriveConfidenceLevelFromPercentage(performancePercentage);
    } else {
      // For assignments, prefer user-provided value; fall back to score-based if missing
      effectiveConfidenceLevel =
        typeof confidenceLevel === 'number'
          ? confidenceLevel
          : deriveConfidenceLevelFromPercentage(performancePercentage);
    }

    const achievementScore = Math.min(100, (Array.isArray(achievements) ? achievements.length : 0) * 25);
    const finalConfidenceScore =
      assignmentDoc.type === 'quiz'
        ? performancePercentage * 0.6 + attendancePercentage * 0.3 + achievementScore * 0.1
        : performancePercentage * 0.6 +
          attendancePercentage * 0.2 +
          (effectiveConfidenceLevel * 20) * 0.1 +
          achievementScore * 0.1;
    const learningStrength = getLearningStrength(finalConfidenceScore);

    if (assignmentDoc.type === 'quiz') {
      outcomeAnalysis = await buildQuizOutcomeAnalysis(
        assignmentDoc,
        storedAnswers,
        performancePercentage,
        finalConfidenceScore,
        attendancePercentage
      );
    }

    if (assignmentDoc.type === 'quiz') {
      try {
        await QuizAttempt.create({
          student_id: req.user._id,
          quiz_id: assignmentId,
          answers: storedAnswers,
          score: marksObtained
        });
      } catch (attemptError) {
        if (attemptError && attemptError.code === 11000) {
          return res.status(400).json({
            message: 'You have already attempted this quiz. Multiple submissions are not allowed.'
          });
        }
        throw attemptError;
      }
    }

    const submission = await Submission.create({
      student: req.user._id,
      assignment: assignmentId,
      answer: assignmentDoc.type === 'assignment' && answer != null ? String(answer).trim() : '',
      answers: storedAnswers,
      marksObtained,
      confidenceLevel: effectiveConfidenceLevel,
      attendancePercentage,
      achievements: Array.isArray(achievements) ? achievements.filter(Boolean).map((a) => String(a).trim()) : [],
      extracurricularActivities: Array.isArray(extracurricularActivities)
        ? extracurricularActivities.filter(Boolean).map((e) => String(e).trim())
        : [],
      performancePercentage,
      calculatedConfidenceScore: finalConfidenceScore,
      learningStrength,
      outcomeAnalysis
    });

    await Notification.create({
      user: req.user._id,
      title: 'Submission Successful',
      message: 'Your submission has been recorded. Marks are calculated by the system.',
      type: 'submission_success',
      link: '/submissions'
    });

    const populated = await Submission.findById(submission._id)
      .populate('assignment', 'title totalMarks type')
      .populate('student', 'name email');

    const out = populated.toObject();
    if (quizMeta && assignmentDoc.type === 'quiz') {
      out.totalQuestions = quizMeta.totalQuestions;
      out.correctAnswers = quizMeta.correctCount;
      out.percentage = quizMeta.performancePercentage;
      out.outcomeSummary = outcomeAnalysis;
    }

    res.status(201).json(out);
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
      .populate('assignment', 'title totalMarks type course')
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
      .populate('assignment', 'title totalMarks type')
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
      .populate('assignment', 'title totalMarks type course');
    if (!submission) return res.status(404).json({ message: 'Submission not found' });
    if (req.user.role === 'student' && submission.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    res.json(submission);
  } catch (error) {
    next(error);
  }
};
