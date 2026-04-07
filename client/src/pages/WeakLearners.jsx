import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function WeakLearners() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data)).catch(() => setCourses([])).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedCourse) {
      setAnalytics(null);
      return;
    }
    setLoading(true);
    api.get(`/analytics/course/${selectedCourse}`)
      .then((res) => setAnalytics(res.data))
      .catch(() => setAnalytics(null))
      .finally(() => setLoading(false));
  }, [selectedCourse]);

  const weakAreas = analytics?.weakAreas || analytics?.weakLearners || [];

  if (loading && !analytics) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Weak Learners</h1>
      <div className="flex gap-4 flex-wrap items-center">
        <label className="text-slate-700 font-medium">Course:</label>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-3 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        <Link to="/submissions" className="text-indigo-600 font-medium hover:underline">View all submissions</Link>
      </div>
      {selectedCourse && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-4">Learners with Weak performance</h2>
          {weakAreas.length ? (
            <ul className="space-y-3">
              {weakAreas.map((w, i) => (
                <li key={i} className="border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-medium text-slate-800">{w.student}</span> — {w.assignment}
                  {w.marks != null && <span className="text-slate-600 text-sm"> · Marks: {w.marks}</span>}
                  {w.attendancePercentage != null && <span className="text-slate-600 text-sm"> · Attendance: {w.attendancePercentage}%</span>}
                  {w.achievements?.length > 0 && <span className="text-slate-600 text-sm"> · Achievements: {w.achievements.join(', ')}</span>}
                </li>
              ))}
            </ul>
          ) : <p className="text-slate-500">No weak learners identified for this course.</p>}
        </div>
      )}
      {!selectedCourse && <p className="text-slate-500">Select a course to view weak learners.</p>}
    </div>
  );
}
