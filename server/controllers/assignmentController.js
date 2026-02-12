const Assignment = require('../models/Assignment');
const Course = require('../models/Course');

exports.createAssignment = async (req, res, next) => {
  try {
    const { title, description, course, totalMarks, dueDate } = req.body;
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: 'Course not found' });
    if (courseDoc.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to add assignments to this course' });
    }
    const assignment = await Assignment.create({ title, description, course, totalMarks, dueDate });
    res.status(201).json(assignment);
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentsByCourse = async (req, res, next) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .populate('course', 'title')
      .sort('-dueDate');
    res.json(assignments);
  } catch (error) {
    next(error);
  }
};

exports.getAssignmentById = async (req, res, next) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate('course', 'title');
    if (!assignment) return res.status(404).json({ message: 'Assignment not found' });
    res.json(assignment);
  } catch (error) {
    next(error);
  }
};
