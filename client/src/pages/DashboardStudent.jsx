import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#ef4444', '#eab308', '#22c55e'];

export default function DashboardStudent() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/analytics/student/${user._id}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ performancePerAssignment: [], distribution: { weak: 0, medium: 0, strong: 0 }, trend: [] }))
      .finally(() => setLoading(false));
  }, [user._id]);

  if (loading) return <LoadingSpinner />;

  const perf = data?.performancePerAssignment || [];
  const dist = data?.distribution || { weak: 0, medium: 0, strong: 0 };
  const pieData = [
    { name: 'Weak', value: dist.weak, color: COLORS[0] },
    { name: 'Medium', value: dist.medium, color: COLORS[1] },
    { name: 'Strong', value: dist.strong, color: COLORS[2] }
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Student Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Avg Confidence Score</p>
          <p className="text-2xl font-bold text-indigo-600">{data?.avgConfidenceScore ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-slate-500 text-sm">Submissions</p>
          <p className="text-2xl font-bold text-slate-800">{perf.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <Link to="/assignments" className="text-indigo-600 font-medium hover:underline">View Assignments →</Link>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Performance per Assignment</h2>
          {perf.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={perf}>
                <XAxis dataKey="assignment" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="confidenceScore" fill="#6366f1" name="Confidence Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500">No submissions yet.</p>
          )}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Weak / Medium / Strong</h2>
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
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-4">Confidence Score Trend</h2>
        {data?.trend?.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#6366f1" name="Score" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500">No trend data yet.</p>
        )}
      </div>
    </div>
  );
}
