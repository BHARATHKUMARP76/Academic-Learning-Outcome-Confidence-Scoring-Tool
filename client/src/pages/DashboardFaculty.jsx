import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line } from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#ef4444', '#eab308', '#22c55e'];

export default function DashboardFaculty() {
  const [courses, setCourses] = useState([]);
  const [courseAnalytics, setCourseAnalytics] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses').then((res) => {
      setCourses(res.data);
      if (res.data.length && !selectedCourse) setSelectedCourse(res.data[0]._id);
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    api.get(`/analytics/course/${selectedCourse}`).then((res) => setCourseAnalytics(res.data)).catch(() => setCourseAnalytics(null));
  }, [selectedCourse]);

  if (loading) return <LoadingSpinner />;

  const byAssignment = courseAnalytics?.byAssignment || [];
  const dist = courseAnalytics?.distribution || { weak: 0, medium: 0, strong: 0 };
  const pieData = [
    { name: 'Weak', value: dist.weak, color: COLORS[0] },
    { name: 'Medium', value: dist.medium, color: COLORS[1] },
    { name: 'Strong', value: dist.strong, color: COLORS[2] }
  ].filter((d) => d.value > 0);
  const attendanceTrend = courseAnalytics?.attendanceTrend || [];
  const assignmentVsQuiz = courseAnalytics?.assignmentVsQuizPerformance || [];
  const confidenceTrend = courseAnalytics?.confidenceTrend || [];
  const weakAreas = courseAnalytics?.weakAreas || [];
  const submissionsWithDetails = courseAnalytics?.submissionsWithDetails || [];
  const mcqAccuracy = courseAnalytics?.mcqAccuracy || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Faculty Dashboard</h1>
      <div className="flex gap-4 items-center flex-wrap">
        <label className="text-slate-700 font-medium">Course:</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg"
        >
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        <Link to="/submissions" className="text-indigo-600 font-medium hover:underline">View Submissions</Link>
        <Link to="/weak-learners" className="text-indigo-600 font-medium hover:underline">Weak Learners</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Performance by Assignment</h2>
          {byAssignment.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={byAssignment}>
                <XAxis dataKey="assignment" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="avgScore" fill="#6366f1" name="Avg Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500">No data for this course.</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Learning Strength Distribution</h2>
          {pieData.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500">No data yet.</p>
          )}
        </div>
      </div>

      {assignmentVsQuiz.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Assignment vs Quiz Performance</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={assignmentVsQuiz}>
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#8b5cf6" name="Avg score" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {attendanceTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Attendance Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={attendanceTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Area type="monotone" dataKey="attendance" stroke="#22c55e" fill="#22c55e33" name="Attendance %" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {confidenceTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Confidence Score Trend</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={confidenceTrend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgScore" stroke="#6366f1" name="Avg Score" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {mcqAccuracy.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">MCQ Accuracy (Quizzes)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mcqAccuracy}>
              <XAxis dataKey="assignment" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#22c55e" name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {weakAreas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Weak Learning Areas</h2>
          <ul className="list-disc list-inside text-slate-600">
            {weakAreas.slice(0, 10).map((w, i) => (
              <li key={i}>{w.student} — {w.assignment} {w.marks != null && `(Marks: ${w.marks})`} {w.attendancePercentage != null && `Attendance: ${w.attendancePercentage}%`}</li>
            ))}
          </ul>
        </div>
      )}

      {submissionsWithDetails.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm overflow-x-auto">
          <h2 className="font-semibold text-slate-800 mb-4">Submissions (auto-calculated marks, attendance, achievements)</h2>
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2 pr-4">Student</th>
                <th className="py-2 pr-4">Assignment</th>
                <th className="py-2 pr-4">Marks</th>
                <th className="py-2 pr-4">Attendance %</th>
                <th className="py-2 pr-4">Score</th>
                <th className="py-2 pr-4">Strength</th>
                <th className="py-2">Achievements / Extracurricular</th>
              </tr>
            </thead>
            <tbody>
              {submissionsWithDetails.slice(0, 15).map((s, i) => (
                <tr key={i} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{s.student}</td>
                  <td className="py-2 pr-4">{s.assignment}</td>
                  <td className="py-2 pr-4">{s.marks != null ? s.marks : '—'}</td>
                  <td className="py-2 pr-4">{s.attendancePercentage != null ? s.attendancePercentage : '—'}</td>
                  <td className="py-2 pr-4">{s.confidenceScore != null ? s.confidenceScore.toFixed(1) : '—'}</td>
                  <td className="py-2 pr-4">{s.learningStrength}</td>
                  <td className="py-2 text-slate-600">{(s.achievements || []).join(', ')} / {(s.extracurricularActivities || []).join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
