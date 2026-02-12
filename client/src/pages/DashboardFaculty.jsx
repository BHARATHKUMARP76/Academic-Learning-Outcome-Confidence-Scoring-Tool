import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
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
      {courseAnalytics?.weakAreas?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Weak Learning Areas</h2>
          <ul className="list-disc list-inside text-slate-600">
            {courseAnalytics.weakAreas.slice(0, 10).map((w, i) => (
              <li key={i}>{w.student} - {w.assignment}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
