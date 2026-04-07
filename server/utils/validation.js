const { body, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: errors.array().map((e) => e.msg).join(', ') });
  }
  next();
};

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student', 'faculty', 'admin']).withMessage('Valid role is required')
];

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
];

const courseValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim()
];

const outcomeValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('course').isMongoId().withMessage('Valid course ID is required')
];

const assignmentValidation = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').optional().trim(),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('type').optional().isIn(['assignment', 'quiz']).withMessage('Type must be assignment or quiz'),
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('correctAnswer').optional().trim(),
  body('questions').optional().isArray().withMessage('Questions must be an array'),
  body('questions.*.questionText').optional().trim().notEmpty().withMessage('Question text is required'),
  body('questions.*.options').optional().isArray().withMessage('Options must be an array'),
  body('questions.*.options.*').optional().trim(),
  body('questions.*.correctAnswer').optional().trim(),
  body('questions.*.marks').optional().isFloat({ min: 0 }).withMessage('Question marks must be >= 0'),
  body('questions.*.learningOutcome').optional().isMongoId().withMessage('Valid learning outcome ID is required'),
  body('assignedStudents').optional().isArray().withMessage('Assigned students must be an array'),
  body('assignedStudents.*').optional().isMongoId().withMessage('Each assigned student must be a valid student ID')
];

const submissionValidation = [
  body('assignment').isMongoId().withMessage('Valid assignment ID is required'),
  body('answer').optional().trim(),
  body('answers').optional().isArray().withMessage('Answers must be an array'),
  body('answers.*.questionId').optional().isMongoId().withMessage('Valid question ID is required'),
  body('answers.*.selectedOption').optional().trim(),
  body('confidenceLevel').optional().isInt({ min: 1, max: 5 }).withMessage('Confidence level must be 1-5'),
  body('achievements').optional().isArray().withMessage('Achievements must be an array'),
  body('achievements.*').optional().trim(),
  body('extracurricularActivities').optional().isArray().withMessage('Extracurricular activities must be an array'),
  body('extracurricularActivities.*').optional().trim()
];

const attendanceValidation = [
  body('student').isMongoId().withMessage('Valid student ID is required'),
  body('course').isMongoId().withMessage('Valid course ID is required'),
  body('percentage').isFloat({ min: 0, max: 100 }).withMessage('Attendance percentage must be between 0 and 100')
];

const achievementRecordValidation = [
  body('title').trim().notEmpty().withMessage('Certificate title is required'),
  body('platform').trim().notEmpty().withMessage('Course platform is required'),
  body('description').optional().trim()
];

const extracurricularRecordValidation = [
  body('eventName').trim().notEmpty().withMessage('Event name is required'),
  body('eventType').trim().notEmpty().withMessage('Event type is required'),
  body('dateOfParticipation').isISO8601().withMessage('Valid date of participation is required'),
  body('description').optional().trim()
];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  courseValidation,
  outcomeValidation,
  assignmentValidation,
  submissionValidation,
  attendanceValidation,
  achievementRecordValidation,
  extracurricularRecordValidation
};
