const Course = require('../models/Course');
const LearningOutcome = require('../models/LearningOutcome');

exports.createCourse = async (req, res, next) => {
  try {
    const { title, description } = req.body;
    const course = await Course.create({ title, description, faculty: req.user._id });
    res.status(201).json(course);
  } catch (error) {
    next(error);
  }
};

exports.getCourses = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'faculty') query.faculty = req.user._id;
    if (req.user.role === 'student') {
      // Students see all courses (or we could add enrollment later)
      query = {};
    }
    const courses = await Course.find(query)
      .populate('faculty', 'name email')
      .populate('learningOutcomes')
      .sort('-createdAt');
    res.json(courses);
  } catch (error) {
    next(error);
  }
};

exports.getCourseById = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('faculty', 'name email')
      .populate('learningOutcomes');
    if (!course) return res.status(404).json({ message: 'Course not found' });
    res.json(course);
  } catch (error) {
    next(error);
  }
};
