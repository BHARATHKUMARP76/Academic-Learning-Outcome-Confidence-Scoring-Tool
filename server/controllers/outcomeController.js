const LearningOutcome = require('../models/LearningOutcome');
const Course = require('../models/Course');

exports.createOutcome = async (req, res, next) => {
  try {
    const { title, description, course } = req.body;
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: 'Course not found' });
    if (courseDoc.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add outcomes to this course' });
    }
    const outcome = await LearningOutcome.create({ title, description, course });
    courseDoc.learningOutcomes.push(outcome._id);
    await courseDoc.save();
    res.status(201).json(outcome);
  } catch (error) {
    next(error);
  }
};

exports.getOutcomesByCourse = async (req, res, next) => {
  try {
    const outcomes = await LearningOutcome.find({ course: req.params.courseId }).sort('-createdAt');
    res.json(outcomes);
  } catch (error) {
    next(error);
  }
};
