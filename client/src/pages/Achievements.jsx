import { useEffect, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

const fileBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

function extractFilename(fileValue) {
  if (!fileValue) return '';
  const normalized = String(fileValue).replace(/\\/g, '/').trim();
  const withoutQuery = normalized.split('?')[0];
  const parts = withoutQuery.split('/');
  return parts[parts.length - 1] || '';
}

function buildFileUrl(filePath) {
  const filename = extractFilename(filePath);
  return filename ? `${fileBaseUrl}/uploads/${filename}` : '#';
}

export default function Achievements() {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState([]);
  const [activities, setActivities] = useState([]);

  const [achForm, setAchForm] = useState({ title: '', platform: '', description: '' });
  const [achFile, setAchFile] = useState(null);
  const [achSubmitting, setAchSubmitting] = useState(false);

  const [extForm, setExtForm] = useState({
    eventName: '',
    eventType: '',
    dateOfParticipation: '',
    description: ''
  });
  const [extFile, setExtFile] = useState(null);
  const [extSubmitting, setExtSubmitting] = useState(false);

  const load = () =>
    Promise.all([api.get('/achievements/me'), api.get('/extracurricular/me')])
      .then(([aRes, eRes]) => {
        setAchievements(aRes.data || []);
        setActivities(eRes.data || []);
      })
      .catch(() => {
        addToast('Could not load your records', 'error');
      });

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, []);

  const handleAchievementSubmit = async (e) => {
    e.preventDefault();
    if (!achFile) {
      addToast('Please attach a PDF certificate', 'error');
      return;
    }
    setAchSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('title', achForm.title.trim());
      fd.append('platform', achForm.platform.trim());
      if (achForm.description.trim()) fd.append('description', achForm.description.trim());
      fd.append('certificate', achFile);
      await api.post('/achievements', fd);
      addToast('Achievement submitted', 'success');
      setAchForm({ title: '', platform: '', description: '' });
      setAchFile(null);
      e.target.reset();
      await load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit achievement', 'error');
    } finally {
      setAchSubmitting(false);
    }
  };

  const handleExtracurricularSubmit = async (e) => {
    e.preventDefault();
    if (!extFile) {
      addToast('Please attach proof (PDF or image)', 'error');
      return;
    }
    if (!extForm.dateOfParticipation) {
      addToast('Please select the date of participation', 'error');
      return;
    }
    setExtSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('eventName', extForm.eventName.trim());
      fd.append('eventType', extForm.eventType.trim());
      fd.append('dateOfParticipation', extForm.dateOfParticipation);
      if (extForm.description.trim()) fd.append('description', extForm.description.trim());
      fd.append('proof', extFile);
      await api.post('/extracurricular', fd);
      addToast('Activity submitted', 'success');
      setExtForm({ eventName: '', eventType: '', dateOfParticipation: '', description: '' });
      setExtFile(null);
      e.target.reset();
      await load();
    } catch (err) {
      addToast(err.response?.data?.message || 'Failed to submit activity', 'error');
    } finally {
      setExtSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Achievements & extracurricular activities</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Submit certificates and activity proof for faculty review. PDFs only for certificates; proof can be PDF or image.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Submit achievement</h2>
          <form onSubmit={handleAchievementSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Certificate title</label>
              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={achForm.title}
                onChange={(e) => setAchForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Platform (e.g. Coursera, NPTEL)</label>
              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={achForm.platform}
                onChange={(e) => setAchForm((f) => ({ ...f, platform: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={achForm.description}
                onChange={(e) => setAchForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Certificate (PDF)</label>
              <input
                required
                type="file"
                accept="application/pdf"
                onChange={(e) => setAchFile(e.target.files?.[0] || null)}
              />
            </div>
            <button
              type="submit"
              disabled={achSubmitting}
              className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {achSubmitting ? 'Submitting…' : 'Submit achievement'}
            </button>
          </form>
        </section>

        <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h2 className="text-lg font-semibold text-slate-800">Submit extracurricular activity</h2>
          <form onSubmit={handleExtracurricularSubmit} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event name</label>
              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={extForm.eventName}
                onChange={(e) => setExtForm((f) => ({ ...f, eventName: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Event type (e.g. Hackathon, Workshop)</label>
              <input
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={extForm.eventType}
                onChange={(e) => setExtForm((f) => ({ ...f, eventType: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Date of participation</label>
              <input
                required
                type="date"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={extForm.dateOfParticipation}
                onChange={(e) => setExtForm((f) => ({ ...f, dateOfParticipation: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
              <textarea
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                value={extForm.description}
                onChange={(e) => setExtForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Proof (PDF or image)</label>
              <input
                required
                type="file"
                accept="application/pdf,image/*"
                onChange={(e) => setExtFile(e.target.files?.[0] || null)}
              />
            </div>
            <button
              type="submit"
              disabled={extSubmitting}
              className="rounded-lg bg-indigo-600 text-white px-4 py-2 text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {extSubmitting ? 'Submitting…' : 'Submit activity'}
            </button>
          </form>
        </section>
      </div>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">My submitted achievements</h2>
        {achievements.length ? (
          <ul className="divide-y divide-slate-100">
            {achievements.map((a) => (
              <li key={a._id} className="py-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">{a.title}</p>
                  <p className="text-sm text-slate-600">{a.platform}</p>
                  {a.description ? <p className="text-sm text-slate-500 mt-1">{a.description}</p> : null}
                  <p className="text-xs text-slate-400 mt-1">
                    {a.submittedAt ? new Date(a.submittedAt).toLocaleString() : ''}
                  </p>
                </div>
                <a
                  href={buildFileUrl(a.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline shrink-0"
                >
                  View certificate
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No achievements submitted yet.</p>
        )}
      </section>

      <section className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3">
        <h2 className="text-lg font-semibold text-slate-800">My extracurricular activities</h2>
        {activities.length ? (
          <ul className="divide-y divide-slate-100">
            {activities.map((x) => (
              <li key={x._id} className="py-3 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-800">{x.eventName}</p>
                  <p className="text-sm text-slate-600">
                    {x.eventType}
                    {x.dateOfParticipation ? ` · ${new Date(x.dateOfParticipation).toLocaleDateString()}` : ''}
                  </p>
                  {x.description ? <p className="text-sm text-slate-500 mt-1">{x.description}</p> : null}
                </div>
                <a
                  href={buildFileUrl(x.filePath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-indigo-600 hover:underline shrink-0"
                >
                  View proof
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">No activities submitted yet.</p>
        )}
      </section>
    </div>
  );
}
