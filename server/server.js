const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const path = require('path');
const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const outcomeRoutes = require('./routes/outcomes');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const analyticsRoutes = require('./routes/analytics');
const attendanceRoutes = require('./routes/attendance');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');
const achievementRoutes = require('./routes/achievements');
const extracurricularRoutes = require('./routes/extracurricular');

dotenv.config();
console.log("MONGO URI:", process.env.MONGO_URI);
connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/outcomes', outcomeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/extracurricular', extracurricularRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
