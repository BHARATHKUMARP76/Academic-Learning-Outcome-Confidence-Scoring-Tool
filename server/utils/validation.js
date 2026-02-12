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
  body('totalMarks').isInt({ min: 1 }).withMessage('Total marks must be at least 1'),
  body('dueDate').isISO8601().withMessage('Valid due date is required')
];

const submissionValidation = [
  body('assignment').isMongoId().withMessage('Valid assignment ID is required'),
  body('marksObtained').isFloat({ min: 0 }).withMessage('Marks obtained must be non-negative'),
  body('confidenceLevel').isInt({ min: 1, max: 5 }).withMessage('Confidence level must be 1-5')
];

module.exports = {
  handleValidation,
  registerValidation,
  loginValidation,
  courseValidation,
  outcomeValidation,
  assignmentValidation,
  submissionValidation
};
