import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function StudentAssignments() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('achievements');
  const [achievements, setAchievements] = useState([]);
  const [activities, setActivities] = useState([]);

  const [achForm, setAchForm] = useState({ title: '', platform: '', description: '', file: null });
  const [actForm, setActForm] = useState({ eventName: '', eventType: '', date: '', description: '', file: null });

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
    Promise.all([api.get('/achievements/me'), api.get('/extracurricular/me')])
      .then(([aRes, eRes]) => {
        setAchievements(aRes.data || []);
        setActivities(eRes.data || []);
      })
      .catch(() => addToast('Failed to load assignments', 'error'))
      .finally(() => setLoading(false));
  }, [addToast]);

  if (loading) return <LoadingSpinner />;

  const submitAchievement = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('title', achForm.title);
    fd.append('platform', achForm.platform);
    if (achForm.description) fd.append('description', achForm.description);
    if (!achForm.file) {
      addToast('Please upload certificate PDF', 'error');
      return;
    }
    fd.append('certificate', achForm.file);

    api
      .post('/achievements', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => {
        setAchievements((prev) => [res.data, ...prev]);
        setAchForm({ title: '', platform: '', description: '', file: null });
        addToast('Certificate uploaded', 'success');
      })
      .catch((err) => addToast(err.response?.data?.message || 'Upload failed', 'error'));
  };

  const submitActivity = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append('eventName', actForm.eventName);
    fd.append('eventType', actForm.eventType);
    fd.append('dateOfParticipation', actForm.date);
    if (actForm.description) fd.append('description', actForm.description);
    if (!actForm.file) {
      addToast('Please upload supporting proof', 'error');
      return;
    }
    fd.append('proof', actForm.file);

    api
      .post('/extracurricular', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      .then((res) => {
        setActivities((prev) => [res.data, ...prev]);
        setActForm({ eventName: '', eventType: '', date: '', description: '', file: null });
        addToast('Activity submitted', 'success');
      })
      .catch((err) => addToast(err.response?.data?.message || 'Upload failed', 'error'));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>

      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('achievements')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'achievements'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Achievements
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('activities')}
          className={`px-4 py-2 text-sm font-medium ${
            activeTab === 'activities'
              ? 'border-b-2 border-indigo-600 text-indigo-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Extracurricular
        </button>
      </div>

      {activeTab === 'achievements' && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Achievements</h2>
          <p className="text-sm text-slate-600">
            Submit certificates for completed online courses (PDF only). These will be visible to faculty for
            verification.
          </p>
          <form onSubmit={submitAchievement} className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Certificate title"
              value={achForm.title}
              onChange={(e) => setAchForm((f) => ({ ...f, title: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Course platform (Coursera, NPTEL, Udemy, ...)"
              value={achForm.platform}
              onChange={(e) => setAchForm((f) => ({ ...f, platform: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <textarea
              placeholder="Description (optional)"
              value={achForm.description}
              onChange={(e) => setAchForm((f) => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 border rounded-lg md:col-span-2"
            />
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setAchForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg md:col-span-2 hover:bg-indigo-700"
            >
              Upload Certificate
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {achievements.map((a) => (
              <div
                key={a._id}
                className="border border-slate-200 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <p className="text-sm text-slate-600">{a.platform}</p>
                  {a.description && (
                    <p className="text-xs text-slate-500 mt-1">{a.description}</p>
                  )}
                </div>
                <a
                  href={buildFileUrl(a.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 text-sm hover:underline"
                >
                  View PDF
                </a>
              </div>
            ))}
            {!achievements.length && (
              <p className="text-sm text-slate-500">No achievements submitted yet.</p>
            )}
          </div>
        </section>
      )}

      {activeTab === 'activities' && (
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Extracurricular Activities</h2>
          <p className="text-sm text-slate-600">
            Submit hackathons, workshops, competitions and other events (PDF or image proof).
          </p>
          <form onSubmit={submitActivity} className="grid gap-3 md:grid-cols-2">
            <input
              type="text"
              placeholder="Event name"
              value={actForm.eventName}
              onChange={(e) => setActForm((f) => ({ ...f, eventName: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="text"
              placeholder="Event type (Hackathon, Workshop, Competition, ...)"
              value={actForm.eventType}
              onChange={(e) => setActForm((f) => ({ ...f, eventType: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <input
              type="date"
              value={actForm.date}
              onChange={(e) => setActForm((f) => ({ ...f, date: e.target.value }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <textarea
              placeholder="Description"
              value={actForm.description}
              onChange={(e) => setActForm((f) => ({ ...f, description: e.target.value }))}
              className="px-3 py-2 border rounded-lg md:col-span-2"
            />
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setActForm((f) => ({ ...f, file: e.target.files?.[0] || null }))}
              className="px-3 py-2 border rounded-lg"
              required
            />
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg md:col-span-2 hover:bg-indigo-700"
            >
              Submit Activity
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {activities.map((a) => (
              <div
                key={a._id}
                className="border border-slate-200 rounded-lg p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium text-slate-800">{a.eventName}</p>
                  <p className="text-sm text-slate-600">{a.eventType}</p>
                  {a.description && (
                    <p className="text-xs text-slate-500 mt-1">{a.description}</p>
                  )}
                </div>
                <a
                  href={buildFileUrl(a.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 text-sm hover:underline"
                >
                  View PDF
                </a>
              </div>
            ))}
            {!activities.length && (
              <p className="text-sm text-slate-500">No extracurricular activities submitted yet.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

