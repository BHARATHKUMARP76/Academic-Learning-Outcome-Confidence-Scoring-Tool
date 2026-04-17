import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function FacultyAssignmentsReview() {
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [activities, setActivities] = useState([]);

  const fileBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

  const buildFileUrl = (filePath) => {
    if (!filePath) return '#';
    const normalized = String(filePath).replace(/\\/g, '/').trim();
    const withoutQuery = normalized.split('?')[0];
    const parts = withoutQuery.split('/');
    const filename = parts[parts.length - 1] || '';
    return filename ? `${fileBaseUrl}/uploads/${filename}` : '#';
  };

  useEffect(() => {
    Promise.all([api.get('/achievements'), api.get('/extracurricular')])
      .then(([aRes, eRes]) => {
        setAchievements(aRes.data || []);
        setActivities(eRes.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Student Achievements & Activities</h1>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Achievements</h2>
        {achievements.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4 text-left">Student</th>
                  <th className="py-2 pr-4 text-left">Title</th>
                  <th className="py-2 pr-4 text-left">Platform</th>
                  <th className="py-2 pr-4 text-left">Submitted</th>
                  <th className="py-2 pr-4 text-left">Certificate</th>
                </tr>
              </thead>
              <tbody>
                {achievements.map((a) => (
                  <tr key={a._id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{a.student?.name}</td>
                    <td className="py-2 pr-4">{a.title}</td>
                    <td className="py-2 pr-4">{a.platform}</td>
                    <td className="py-2 pr-4">
                      {a.submittedAt ? new Date(a.submittedAt).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <a
                        href={buildFileUrl(a.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        View PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No achievement submissions yet.</p>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">Extracurricular Activities</h2>
        {activities.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-2 pr-4 text-left">Student</th>
                  <th className="py-2 pr-4 text-left">Event</th>
                  <th className="py-2 pr-4 text-left">Type</th>
                  <th className="py-2 pr-4 text-left">Date</th>
                  <th className="py-2 pr-4 text-left">Proof</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a._id} className="border-b border-slate-100">
                    <td className="py-2 pr-4">{a.student?.name}</td>
                    <td className="py-2 pr-4">{a.eventName}</td>
                    <td className="py-2 pr-4">{a.eventType}</td>
                    <td className="py-2 pr-4">
                      {a.dateOfParticipation
                        ? new Date(a.dateOfParticipation).toLocaleDateString()
                        : '—'}
                    </td>
                    <td className="py-2 pr-4">
                      <a
                        href={buildFileUrl(a.filePath)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        View PDF
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-slate-500">No extracurricular submissions yet.</p>
        )}
      </section>
    </div>
  );
}

