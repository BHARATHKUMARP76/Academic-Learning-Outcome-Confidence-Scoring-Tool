const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

const connectDB = require('./config/db');
const { errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const courseRoutes = require('./routes/courses');
const outcomeRoutes = require('./routes/outcomes');
const assignmentRoutes = require('./routes/assignments');
const submissionRoutes = require('./routes/submissions');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notifications');
const userRoutes = require('./routes/users');

dotenv.config();
console.log("MONGO URI:", process.env.MONGO_URI);
connectDB();

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/outcomes', outcomeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/submissions', submissionRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/users', userRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
