const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const LearningOutcome = require('../models/LearningOutcome');

exports.createAssignment = async (req, res, next) => {
  try {
    const { title, description, course, type, totalMarks, dueDate, correctAnswer, questions, assignedStudents } = req.body;
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: 'Course not found' });
    if (courseDoc.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add assignments to this course' });
    }

    let quizQuestions;
    if (type === 'quiz' && Array.isArray(questions)) {
      quizQuestions = questions
        .filter((q) => q && q.questionText && Array.isArray(q.options) && q.options.length > 0)
        .map((q) => ({
          questionText: String(q.questionText).trim(),
          options: q.options.map((opt) => String(opt).trim()).filter(Boolean),
          correctAnswer: q.correctAnswer != null ? String(q.correctAnswer).trim() : '',
          // Each MCQ question is worth 1 mark
          marks: 1,
          learningOutcome: q.learningOutcome
        }));

      const loIds = quizQuestions.map((q) => q.learningOutcome).filter(Boolean);
      if (loIds.length) {
        const validCount = await LearningOutcome.countDocuments({ _id: { $in: loIds }, course });
        if (validCount !== new Set(loIds.map(String)).size) {
          return res.status(400).json({ message: 'Each question learning outcome must belong to the selected course' });
        }
      }
    }

    let computedTotalMarks = totalMarks;
    if (type === 'quiz' && Array.isArray(quizQuestions) && quizQuestions.length) {
      // Total marks for quizzes = number of MCQ questions
      computedTotalMarks = quizQuestions.length;
      if (!computedTotalMarks || computedTotalMarks < 1) {
        return res.status(400).json({ message: 'Quiz total marks must be at least 1 (number of MCQ questions)' });
      }
    }
    if (type === 'quiz' && (!Array.isArray(assignedStudents) || assignedStudents.length === 0)) {
      return res.status(400).json({ message: 'Quiz must be assigned to at least one student.' });
    }

    const assignment = await Assignment.create({
      title,
      description,
      course,
      type: type === 'quiz' ? 'quiz' : 'assignment',
      totalMarks: computedTotalMarks,
      dueDate,
      correctAnswer: type === 'quiz' ? undefined : correctAnswer != null ? String(correctAnswer).trim() : undefined,
      questions: quizQuestions,
      assignedStudents:
        type === 'quiz' && Array.isArray(assignedStudents)
          ? [...new Set(assignedStudents.map(String))]
          : []
    });
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};

exports.updateAssignment = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    if (assignment.course.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to modify this assignment' });
    }
    const { title, description, type, totalMarks, dueDate, correctAnswer, questions, assignedStudents } = req.body;
    if (title != null) assignment.title = title;
    if (description != null) assignment.description = description;
    if (type != null) assignment.type = type === 'quiz' ? 'quiz' : 'assignment';
    if (totalMarks != null && assignment.type !== 'quiz') assignment.totalMarks = totalMarks;
    if (dueDate != null) assignment.dueDate = dueDate;
    if (correctAnswer !== undefined) {
      assignment.correctAnswer =
        assignment.type === 'quiz' ? '' : correctAnswer != null ? String(correctAnswer).trim() : '';
    }
    if (Array.isArray(questions)) {
      // Only faculty reach here and route is shared for assignments/quizzes
      const isQuiz = (type && type === 'quiz') || assignment.type === 'quiz';
      if (isQuiz) {
        const sanitizedQuestions = questions
          .filter((q) => q && q.questionText && Array.isArray(q.options) && q.options.length > 0)
          .map((q) => ({
            questionText: String(q.questionText).trim(),
            options: q.options.map((opt) => String(opt).trim()).filter(Boolean),
            correctAnswer: q.correctAnswer != null ? String(q.correctAnswer).trim() : '',
            // Each MCQ question is worth 1 mark
            marks: 1,
            learningOutcome: q.learningOutcome
          }));

        const courseId = assignment.course && (assignment.course._id || assignment.course);
        const loIds = sanitizedQuestions.map((q) => q.learningOutcome).filter(Boolean);
        if (loIds.length) {
          const validCount = await LearningOutcome.countDocuments({ _id: { $in: loIds }, course: courseId });
          if (validCount !== new Set(loIds.map(String)).size) {
            return res.status(400).json({ message: 'Each question learning outcome must belong to this course' });
          }
        }

        assignment.questions = sanitizedQuestions;
        const questionCount = sanitizedQuestions.length;
        if (questionCount && questionCount >= 1) {
          // Total marks for quizzes = number of MCQ questions
          assignment.totalMarks = questionCount;
        }
      }
    }
    if (Array.isArray(assignedStudents)) {
      assignment.assignedStudents =
        assignment.type === 'quiz' ? [...new Set(assignedStudents.map(String))] : [];
    }
    if (assignment.type === 'quiz' && (!Array.isArray(assignment.assignedStudents) || assignment.assignedStudents.length === 0)) {
      return res.status(400).json({ message: 'Quiz must be assigned to at least one student.' });
    }
    await assignment.save();
    res.json(assignment);
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentsByCourse = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('course', 'title')
      .sort('-dueDate');
    if (req.user?.role !== 'student') return res.json(assignments);

    const out = assignments.map((a) => {
      const o = a.toObject();
      delete o.correctAnswer;
      if (Array.isArray(o.questions)) {
        o.questions = o.questions.map((q) => {
          const { correctAnswer: _ca, ...rest } = q;
          return rest;
        });
      }
      return o;
    });
    res.json(out);
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'title');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    const out = assignment.toObject();
    if (req.user?.role === 'student') {
      delete out.correctAnswer;
      if (Array.isArray(out.questions)) {
        out.questions = out.questions.map((q) => {
          const { correctAnswer: _ca, ...rest } = q;
          return rest;
        });
      }
    }
    res.json(out);
  } catch (error) {
    next(error);
  }
};
