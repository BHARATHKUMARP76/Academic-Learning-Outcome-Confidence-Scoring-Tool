const Attendance = require('../models/Attendance');
const Course = require('../models/Course');

exports.getAttendanceByCourse = async (req, res, next) => {
  try {
    const courseId = req.params.courseId;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    if (req.user.role === 'student') {
      const record = await Attendance.findOne({ student: req.user._id, course: courseId });
      return res.json(record ? [{ student: req.user._id, course: courseId, percentage: record.percentage }] : []);
    }
    const records = await Attendance.find({ course: courseId }).populate('student', 'name email');
    res.json(records);
  } catch (error) {
    next(error);
  }
};

exports.getMyAttendance = async (req, res, next) => {
  try {
    const records = await Attendance.find({ student: req.user._id }).populate('course', 'title');
    res.json(records);
  } catch (error) {
    next(error);
  }
};

exports.setAttendance = async (req, res, next) => {
  try {
    const { student, course, percentage } = req.body;
    if (percentage < 0 || percentage > 100) {
      return res.status(400).json({ message: 'Attendance percentage must be between 0 and 100' });
    }
    const courseDoc = await Course.findById(course);
    if (!courseDoc) return res.status(404).json({ message: 'Course not found' });
    if (courseDoc.faculty.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to set attendance for this course' });
    }
    const record = await Attendance.findOneAndUpdate(
      { student, course },
      { percentage: Number(percentage), updatedAt: new Date() },
      { new: true, upsert: true }
    ).populate('student', 'name email');
    res.json(record);
  } catch (error) {
    next(error);
  }
};
