# Academic Learning Outcome Confidence Scoring Tool

A full-stack MERN application that measures student academic performance and confidence levels to compute a Learning Outcome Confidence Score. It supports role-based access (Student, Faculty, Admin), dashboards, assignment management, confidence scoring, analytics, and notifications.

## Features

- **Authentication**: Register, Login, JWT, role-based access (student, faculty, admin)
- **Student**: View courses/assignments, submit with confidence level (1–5), view dashboard, performance charts, confidence score, learning strength (Weak/Medium/Strong)
- **Faculty**: Create courses, learning outcomes, assignments; view submissions; course analytics; weak learning areas; dashboard with charts
- **Admin**: View all users; institution analytics; overall trends; dashboard (total students, avg confidence score, weak learner %)
- **Analytics**: Bar chart (performance per assignment), Pie chart (Weak/Medium/Strong), Line chart (confidence trend)
- **Notifications**: Stored in MongoDB (deadline reminder, submission success, result published)

## Tech Stack

- **Frontend**: React (Vite), React Router DOM, Axios, Tailwind CSS, Recharts, Context API
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, express-validator, dotenv, cors

## Project Structure

```
academic-confidence-tool/
├── client/                 # React (Vite) frontend
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── context/
│   │   ├── services/
│   │   └── App.jsx
├── server/                 # Express backend
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   ├── utils/
│   └── server.js
└── README.md
```

## Installation

1. **Clone / open project**
   ```bash
   cd academic-confidence-tool
   ```

2. **Backend**
   ```bash
   cd server
   npm install
   cp .env.example .env
   # Edit .env: set MONGODB_URI and JWT_SECRET
   ```

3. **Frontend**
   ```bash
   cd ../client
   npm install
   ```

## Environment Variables

Create `server/.env` from `server/.env.example` (or use root `.env.example` as reference):

| Variable      | Description                          | Example                          |
|---------------|--------------------------------------|----------------------------------|
| PORT          | Server port                          | 5000                             |
| MONGODB_URI   | MongoDB connection string            | mongodb://localhost:27017/academic-confidence |
| JWT_SECRET    | Secret for JWT signing               | your-secret-key                  |
| CLIENT_URL    | Frontend URL (for CORS)              | http://localhost:5173            |

## Run Instructions

### Backend

1. Ensure MongoDB is running locally (or use a cloud URI in `.env`).
2. From project root:
   ```bash
   cd server
   npm run dev
   ```
   Server runs at `http://localhost:5000`.

3. **Seed data** (optional):
   ```bash
   cd server
   npm run seed
   ```
   Creates: 1 Admin, 1 Faculty, 3 Students, 1 Course, 2 Assignments, sample submissions.

### Frontend

1. From project root:
   ```bash
   cd client
   npm run dev
   ```
   App runs at `http://localhost:5173`. API calls to `/api` are proxied to the backend.

2. **Login after seed**  
   - Admin: `admin@edu.com` / `admin123`  
   - Faculty: `faculty@edu.com` / `faculty123`  
   - Student: `alice@edu.com` / `student123` (or bob/charlie)

## API Documentation

**Base URL**: `http://localhost:5000/api` (or via proxy from frontend: `/api`)

### Auth
- `POST /auth/register` – body: `{ name, email, password, role }`
- `POST /auth/login` – body: `{ email, password }`
- `GET /auth/me` – headers: `Authorization: Bearer <token>`

### Courses
- `POST /courses` – body: `{ title, description }` (faculty/admin)
- `GET /courses` – list courses

### Learning Outcomes
- `POST /outcomes` – body: `{ title, description, course }` (faculty/admin)
- `GET /outcomes/:courseId` – list outcomes for course

### Assignments
- `POST /assignments` – body: `{ title, description, course, totalMarks, dueDate }` (faculty/admin)
- `GET /assignments/:courseId` – list assignments for course
- `GET /assignments/single/:id` – get one assignment

### Submissions
- `POST /submissions` – body: `{ assignment, marksObtained, confidenceLevel }` (student)
- `GET /submissions/student/:id` – submissions by student
- `GET /submissions/course/:id` – submissions by course (faculty/admin)
- `GET /submissions/:id` – one submission

### Analytics
- `GET /analytics/student/:id` – student analytics
- `GET /analytics/course/:id` – course analytics (faculty/admin)
- `GET /analytics/institution` – institution analytics (admin)

### Notifications
- `GET /notifications` – my notifications
- `PATCH /notifications/:id/read` – mark as read
- `PATCH /notifications/read-all` – mark all read

### Users (Admin)
- `GET /users` – all users (admin)

## Confidence Score Logic (Backend)

- `performancePercentage = (marksObtained / totalMarks) * 100`
- `calculatedConfidenceScore = (performancePercentage * confidenceLevel) / 5`
- Learning strength: Score &lt; 50 → Weak; 50–75 → Medium; &gt; 75 → Strong

## Future Enhancements

- Course enrollment (students enroll in courses)
- Bulk import users/assignments
- Email notifications for deadlines and results
- Export analytics to PDF/CSV
- Mobile-responsive refinements and accessibility
