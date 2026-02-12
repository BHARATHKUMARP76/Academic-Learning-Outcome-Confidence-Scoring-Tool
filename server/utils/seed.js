require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const LearningOutcome = require('../models/LearningOutcome');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academic-confidence';

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    await User.deleteMany({});
    await Course.deleteMany({});
    await LearningOutcome.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Notification.deleteMany({});

    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@edu.com',
      password: 'admin123',
      role: 'admin'
    });

    const faculty = await User.create({
      name: 'Dr. Jane Smith',
      email: 'faculty@edu.com',
      password: 'faculty123',
      role: 'faculty'
    });

    const students = await User.create([
      { name: 'Alice Student', email: 'alice@edu.com', password: 'student123', role: 'student' },
      { name: 'Bob Student', email: 'bob@edu.com', password: 'student123', role: 'student' },
      { name: 'Charlie Student', email: 'charlie@edu.com', password: 'student123', role: 'student' }
    ]);

    const course = await Course.create({
      title: 'Introduction to Programming',
      description: 'Fundamentals of programming with JavaScript',
      faculty: faculty._id
    });

    const outcome1 = await LearningOutcome.create({
      title: 'Write basic programs',
      description: 'Understand variables and control flow',
      course: course._id
    });
    const outcome2 = await LearningOutcome.create({
      title: 'Debug code',
      description: 'Identify and fix common errors',
      course: course._id
    });
    course.learningOutcomes = [outcome1._id, outcome2._id];
    await course.save();

    const due1 = new Date();
    due1.setDate(due1.getDate() + 7);
    const due2 = new Date();
    due2.setDate(due2.getDate() + 14);
    const [assign1, assign2] = await Assignment.create([
      { title: 'Quiz 1 - Basics', description: 'Variables and loops', course: course._id, totalMarks: 20, dueDate: due1 },
      { title: 'Assignment 1 - Functions', description: 'Write reusable functions', course: course._id, totalMarks: 30, dueDate: due2 }
    ]);

    const sub1 = await Submission.create({
      student: students[0]._id,
      assignment: assign1._id,
      marksObtained: 18,
      confidenceLevel: 4,
      performancePercentage: 90,
      calculatedConfidenceScore: 72,
      learningStrength: 'Strong',
      submittedAt: new Date()
    });
    const sub2 = await Submission.create({
      student: students[0]._id,
      assignment: assign2._id,
      marksObtained: 15,
      confidenceLevel: 3,
      performancePercentage: 50,
      calculatedConfidenceScore: 30,
      learningStrength: 'Weak',
      submittedAt: new Date()
    });
    const sub3 = await Submission.create({
      student: students[1]._id,
      assignment: assign1._id,
      marksObtained: 14,
      confidenceLevel: 3,
      performancePercentage: 70,
      calculatedConfidenceScore: 42,
      learningStrength: 'Weak',
      submittedAt: new Date()
    });

    await Notification.create([
      { user: students[0]._id, title: 'Submission Success', message: 'Quiz 1 submitted.', type: 'submission_success', read: false },
      { user: faculty._id, title: 'New Submission', message: 'Alice submitted Quiz 1.', type: 'info', read: false }
    ]);

    console.log('Seed completed:');
    console.log('- 1 Admin:', admin.email);
    console.log('- 1 Faculty:', faculty.email);
    console.log('- 3 Students:', students.map((s) => s.email).join(', '));
    console.log('- 1 Course:', course.title);
    console.log('- 2 Learning Outcomes');
    console.log('- 2 Assignments');
    console.log('- 3 Submissions');
    console.log('- 2 Notifications');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
