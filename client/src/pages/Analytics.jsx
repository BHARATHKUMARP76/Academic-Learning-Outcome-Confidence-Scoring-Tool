import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/analytics/institution').then((res) => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;
  const trend = data?.trend || [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Institution Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border p-4">
          <p className="text-slate-500 text-sm">Total Students</p>
          <p className="text-2xl font-bold text-indigo-600">{data?.totalStudents ?? 0}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-slate-500 text-sm">Avg Confidence Score</p>
          <p className="text-2xl font-bold text-slate-800">{data?.avgConfidenceScore ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <p className="text-slate-500 text-sm">Weak Learner %</p>
          <p className="text-2xl font-bold text-red-600">{data?.weakLearnerPercentage ?? 0}%</p>
        </div>
      </div>
      <div className="bg-white rounded-xl border p-4">
        <h2 className="font-semibold text-slate-800 mb-4">Performance Trend</h2>
        {trend.length ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="avgScore" stroke="#6366f1" name="Avg Score" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-slate-500">No trend data yet.</p>
        )}
      </div>
    </div>
  );
}
