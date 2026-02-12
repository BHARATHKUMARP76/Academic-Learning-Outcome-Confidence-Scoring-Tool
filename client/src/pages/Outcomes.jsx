import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Outcomes() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');
  const { addToast } = useToast();
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '' });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (!courseId) {
      setLoading(false);
      return;
    }
    api.get('/outcomes/' + courseId).then((res) => setOutcomes(res.data)).catch(() => setOutcomes([])).finally(() => setLoading(false));
  }, [courseId]);

  const handleCreate = (e) => {
    e.preventDefault();
    api.post('/outcomes', { ...form, course: courseId }).then((res) => {
      setOutcomes((prev) => [res.data, ...prev]);
      setForm({ title: '', description: '' });
      setShowForm(false);
      addToast('Learning outcome created', 'success');
    }).catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'));
  };

  if (loading) return <LoadingSpinner />;
  if (!courseId) return <p className="text-slate-500">Select a course from Courses page.</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Learning Outcomes</h1>
      <button type="button" onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
        {showForm ? 'Cancel' : 'Add Outcome'}
      </button>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-4 space-y-3 max-w-md">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
        </form>
      )}
      <div className="grid gap-4">
        {outcomes.map((o) => (
          <div key={o._id} className="bg-white rounded-xl border p-4">
            <h2 className="font-semibold text-slate-800">{o.title}</h2>
            <p className="text-slate-600 text-sm">{o.description}</p>
          </div>
        ))}
        {!outcomes.length && <p className="text-slate-500">No learning outcomes yet.</p>}
      </div>
    </div>
  );
}
