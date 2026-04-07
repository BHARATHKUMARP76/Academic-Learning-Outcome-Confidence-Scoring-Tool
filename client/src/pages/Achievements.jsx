import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Achievements() {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    Promise.all([
      api.get(`/submissions/student/${user._id}`),
      api.get(`/analytics/student/${user._id}`)
    ])
      .then(([subRes, anaRes]) => {
        setSubmissions(subRes.data || []);
        setAnalytics(anaRes.data);
      })
      .catch(() => { setSubmissions([]); setAnalytics(null); })
      .finally(() => setLoading(false));
  }, [user?._id]);

  if (loading) return <LoadingSpinner />;

  const allAchievements = submissions.reduce((acc, s) => acc.concat(s.achievements || []), []);
  const allExtracurricular = submissions.reduce((acc, s) => acc.concat(s.extracurricularActivities || []), []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Achievements</h1>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-3">My achievements</h2>
          {allAchievements.length ? (
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              {[...new Set(allAchievements)].map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          ) : <p className="text-slate-500">No achievements recorded yet. Add them when you submit assignments.</p>}
        </div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-3">Extracurricular activities</h2>
          {allExtracurricular.length ? (
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              {[...new Set(allExtracurricular)].map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ) : <p className="text-slate-500">No extracurricular activities recorded yet.</p>}
        </div>
      </div>
      {analytics?.achievements?.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <h2 className="font-semibold text-slate-800 mb-2">Summary</h2>
          <p className="text-slate-600">Total distinct achievements: {analytics.achievements.length}</p>
        </div>
      )}
    </div>
  );
}
