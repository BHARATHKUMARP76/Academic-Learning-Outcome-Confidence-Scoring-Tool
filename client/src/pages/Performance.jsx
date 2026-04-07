import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#ef4444', '#eab308', '#22c55e'];

export default function Performance() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    api.get(`/analytics/student/${user._id}`)
      .then((res) => setData(res.data))
      .catch(() => setData({ performancePerAssignment: [], distribution: { weak: 0, medium: 0, strong: 0 }, trend: [], attendanceTrend: [], assignmentVsQuizPerformance: [] }))
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
  const attendanceTrend = data?.attendanceTrend || [];
  const assignmentVsQuiz = data?.assignmentVsQuizPerformance || [];
  const mcqAccuracy = data?.mcqAccuracy || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Performance & Confidence</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-slate-500 text-sm">Avg Confidence Score</p>
          <p className="text-2xl font-bold text-indigo-600">{data?.avgConfidenceScore ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-slate-500 text-sm">Submissions</p>
          <p className="text-2xl font-bold text-slate-800">{perf.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <p className="text-slate-500 text-sm">Learning strength</p>
          <p className="text-lg font-semibold text-slate-800">{dist.strong > 0 ? 'Strong' : dist.medium > 0 ? 'Medium' : dist.weak > 0 ? 'Weak' : '—'}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-4">Performance per assignment</h2>
          {perf.length ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={perf}>
                <XAxis dataKey="assignment" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="confidenceScore" fill="#6366f1" name="Confidence Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-slate-500">No submissions yet.</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
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
          ) : <p className="text-slate-500">No data yet.</p>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h2 className="font-semibold text-slate-800 mb-4">Confidence score trend</h2>
        {data?.trend?.length ? (
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.trend}>
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#6366f1" name="Score" />
            </LineChart>
          </ResponsiveContainer>
        ) : <p className="text-slate-500">No trend data yet.</p>}
      </div>
      {attendanceTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-4">Attendance trend</h2>
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
      {assignmentVsQuiz.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-4">Assignment vs Quiz performance</h2>
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

      {mcqAccuracy.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-4">MCQ Accuracy (My quizzes)</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={mcqAccuracy}>
              <XAxis dataKey="assignment" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="accuracy" fill="#22c55e" name="Accuracy %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
