require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Course = require('../models/Course');
const LearningOutcome = require('../models/LearningOutcome');
const Assignment = require('../models/Assignment');
const Submission = require('../models/Submission');
const Notification = require('../models/Notification');
const Attendance = require('../models/Attendance');

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/academic-confidence';

function getLearningStrength(score) {
  if (score < 50) return 'Weak';
  if (score <= 75) return 'Medium';
  return 'Strong';
}

function computeAchievementScore(achievements) {
  return Math.min(100, (Array.isArray(achievements) ? achievements.length : 0) * 25);
}

function computeFinalConfidenceScore({ marksObtained, totalMarks, attendancePercentage, confidenceLevel, achievements }) {
  const tm = totalMarks || 1;
  const performancePercentage = tm ? (marksObtained / tm) * 100 : 0;
  const achievementScore = computeAchievementScore(achievements);
  const finalConfidenceScore =
    performancePercentage * 0.6 +
    attendancePercentage * 0.2 +
    (confidenceLevel * 20) * 0.1 +
    achievementScore * 0.1;
  return {
    performancePercentage,
    calculatedConfidenceScore: finalConfidenceScore,
    learningStrength: getLearningStrength(finalConfidenceScore)
  };
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    await User.deleteMany({});
    await Course.deleteMany({});
    await LearningOutcome.deleteMany({});
    await Assignment.deleteMany({});
    await Submission.deleteMany({});
    await Notification.deleteMany({});
    await Attendance.deleteMany({});

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
    const course2 = await Course.create({
      title: 'Data Structures',
      description: 'Core data structures and algorithmic thinking',
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

    const dsOutcome1 = await LearningOutcome.create({
      title: 'Use arrays and linked lists',
      description: 'Understand core operations and complexity',
      course: course2._id
    });
    const dsOutcome2 = await LearningOutcome.create({
      title: 'Analyze time complexity',
      description: 'Big-O reasoning for common algorithms',
      course: course2._id
    });
    course2.learningOutcomes = [dsOutcome1._id, dsOutcome2._id];
    await course2.save();

    const due1 = new Date();
    due1.setDate(due1.getDate() + 7);
    const due2 = new Date();
    due2.setDate(due2.getDate() + 14);
    const quiz1Questions = [
      {
        questionText: 'What is the value of x after: let x = 2; x = x + 3;',
        options: ['2', '3', '5', '6'],
        correctAnswer: '5',
        marks: 5,
        learningOutcome: outcome1._id
      },
      {
        questionText: 'Which loop is best when the number of iterations is known?',
        options: ['for', 'while', 'do-while', 'switch'],
        correctAnswer: 'for',
        marks: 5,
        learningOutcome: outcome1._id
      },
      {
        questionText: 'Which tool helps find and fix errors in code?',
        options: ['Debugger', 'Compiler', 'Formatter', 'Minifier'],
        correctAnswer: 'Debugger',
        marks: 10,
        learningOutcome: outcome2._id
      }
    ];
    const quiz1Total = quiz1Questions.reduce((s, q) => s + q.marks, 0);

    const [quiz1, assign1] = await Assignment.create([
      {
        title: 'Quiz 1 - Basics (MCQ)',
        description: 'Variables, loops, debugging',
        course: course._id,
        type: 'quiz',
        totalMarks: quiz1Total,
        dueDate: due1,
        questions: quiz1Questions
      },
      {
        title: 'Assignment 1 - Functions',
        description: 'Write reusable functions',
        course: course._id,
        type: 'assignment',
        totalMarks: 30,
        dueDate: due2,
        correctAnswer: 'return'
      }
    ]);

    const due3 = new Date();
    due3.setDate(due3.getDate() + 10);
    const dsQuizQuestions = [
      {
        questionText: 'Which operation is typically O(1) for arrays by index?',
        options: ['Access by index', 'Insert at beginning', 'Delete in middle', 'Search unsorted'],
        correctAnswer: 'Access by index',
        marks: 10,
        learningOutcome: dsOutcome1._id
      },
      {
        questionText: 'Big-O of binary search on a sorted array is:',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        correctAnswer: 'O(log n)',
        marks: 10,
        learningOutcome: dsOutcome2._id
      }
    ];
    const dsQuizTotal = dsQuizQuestions.reduce((s, q) => s + q.marks, 0);
    const dsQuiz = await Assignment.create({
      title: 'Quiz 2 - Data Structures (MCQ)',
      description: 'Arrays and complexity',
      course: course2._id,
      type: 'quiz',
      totalMarks: dsQuizTotal,
      dueDate: due3,
      questions: dsQuizQuestions
    });

    await Attendance.create([
      { student: students[0]._id, course: course._id, percentage: 92 },
      { student: students[1]._id, course: course._id, percentage: 78 },
      { student: students[2]._id, course: course._id, percentage: 65 },
      { student: students[0]._id, course: course2._id, percentage: 88 },
      { student: students[1]._id, course: course2._id, percentage: 71 },
      { student: students[2]._id, course: course2._id, percentage: 60 }
    ]);

    // Quiz submissions use MCQ answers; marks/confidence are precomputed like the backend does.
    const aliceQuiz1Answers = quiz1.questions.map((q) => ({
      questionId: q._id,
      selectedOption: q.correctAnswer // 100% accuracy
    }));
    const aliceQuiz1Marks = quiz1.questions.reduce((s, q) => s + q.marks, 0);
    const aliceQuiz1Achievements = ['Code competition winner', 'Peer tutor'];
    const aliceQuiz1Meta = computeFinalConfidenceScore({
      marksObtained: aliceQuiz1Marks,
      totalMarks: quiz1.totalMarks,
      attendancePercentage: 92,
      confidenceLevel: 4,
      achievements: aliceQuiz1Achievements
    });
    await Submission.create({
      student: students[0]._id,
      assignment: quiz1._id,
      answers: aliceQuiz1Answers,
      marksObtained: aliceQuiz1Marks,
      confidenceLevel: 4,
      attendancePercentage: 92,
      achievements: aliceQuiz1Achievements,
      extracurricularActivities: ['Programming club', 'Hackathon'],
      performancePercentage: aliceQuiz1Meta.performancePercentage,
      calculatedConfidenceScore: aliceQuiz1Meta.calculatedConfidenceScore,
      learningStrength: aliceQuiz1Meta.learningStrength,
      submittedAt: new Date()
    });

    const aliceAssignAchievements = ['Code competition winner'];
    const aliceAssignMarks = 30; // matches correctAnswer 'return' (seeded as ideal)
    const aliceAssignMeta = computeFinalConfidenceScore({
      marksObtained: aliceAssignMarks,
      totalMarks: assign1.totalMarks,
      attendancePercentage: 92,
      confidenceLevel: 3,
      achievements: aliceAssignAchievements
    });
    await Submission.create({
      student: students[0]._id,
      assignment: assign1._id,
      answer: 'return',
      marksObtained: aliceAssignMarks,
      confidenceLevel: 3,
      attendancePercentage: 92,
      achievements: aliceAssignAchievements,
      extracurricularActivities: ['Programming club'],
      performancePercentage: aliceAssignMeta.performancePercentage,
      calculatedConfidenceScore: aliceAssignMeta.calculatedConfidenceScore,
      learningStrength: aliceAssignMeta.learningStrength,
      submittedAt: new Date()
    });

    const bobQuiz1Answers = quiz1.questions.map((q, i) => ({
      questionId: q._id,
      selectedOption: i === 0 ? q.correctAnswer : 'while'
    }));
    const bobQuiz1Marks =
      (quiz1.questions[0]?.marks || 0) + 0 + 0; // only first correct
    const bobQuiz1Meta = computeFinalConfidenceScore({
      marksObtained: bobQuiz1Marks,
      totalMarks: quiz1.totalMarks,
      attendancePercentage: 78,
      confidenceLevel: 3,
      achievements: []
    });
    await Submission.create({
      student: students[1]._id,
      assignment: quiz1._id,
      answers: bobQuiz1Answers,
      marksObtained: bobQuiz1Marks,
      confidenceLevel: 3,
      attendancePercentage: 78,
      achievements: [],
      extracurricularActivities: ['Study group'],
      performancePercentage: bobQuiz1Meta.performancePercentage,
      calculatedConfidenceScore: bobQuiz1Meta.calculatedConfidenceScore,
      learningStrength: bobQuiz1Meta.learningStrength,
      submittedAt: new Date()
    });

    const charlieDsQuizAnswers = dsQuiz.questions.map((q, i) => ({
      questionId: q._id,
      selectedOption: i === 0 ? q.correctAnswer : 'O(n)' // 1 correct, 1 wrong
    }));
    const charlieDsQuizMarks = (dsQuiz.questions[0]?.marks || 0);
    const charlieDsQuizAchievements = ['Volunteer mentor'];
    const charlieDsQuizMeta = computeFinalConfidenceScore({
      marksObtained: charlieDsQuizMarks,
      totalMarks: dsQuiz.totalMarks,
      attendancePercentage: 60,
      confidenceLevel: 2,
      achievements: charlieDsQuizAchievements
    });
    await Submission.create({
      student: students[2]._id,
      assignment: dsQuiz._id,
      answers: charlieDsQuizAnswers,
      marksObtained: charlieDsQuizMarks,
      confidenceLevel: 2,
      attendancePercentage: 60,
      achievements: charlieDsQuizAchievements,
      extracurricularActivities: ['Robotics club'],
      performancePercentage: charlieDsQuizMeta.performancePercentage,
      calculatedConfidenceScore: charlieDsQuizMeta.calculatedConfidenceScore,
      learningStrength: charlieDsQuizMeta.learningStrength,
      submittedAt: new Date()
    });

    await Notification.create([
      { user: students[0]._id, title: 'Submission Success', message: 'Your work has been submitted successfully.', type: 'submission_success', read: false },
      { user: faculty._id, title: 'New Submission', message: 'A student submitted new work.', type: 'info', read: false }
    ]);

    console.log('Seed completed:');
    console.log('- 1 Admin:', admin.email);
    console.log('- 1 Faculty:', faculty.email);
    console.log('- 3 Students:', students.map((s) => s.email).join(', '));
    console.log('- 1 Course:', course.title);
    console.log('- 2 Courses:', course.title, ',', course2.title);
    console.log('- Learning Outcomes created for both courses');
    console.log('- Assignments & Quizzes created (including MCQ quizzes)');
    console.log('- Attendance records created');
    console.log('- Submissions created (including quiz MCQ answers, auto-calculated marks & confidence scores)');
    console.log('- 2 Notifications');
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
