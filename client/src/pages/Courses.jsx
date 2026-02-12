import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Courses() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '' });
  const [showForm, setShowForm] = useState(false);
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data)).catch(() => addToast('Failed to load courses', 'error')).finally(() => setLoading(false));
  }, [addToast]);

  const handleCreate = (e) => {
    e.preventDefault();
    api.post('/courses', form).then((res) => {
      setCourses((prev) => [res.data, ...prev]);
      setForm({ title: '', description: '' });
      setShowForm(false);
      addToast('Course created', 'success');
    }).catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
        {isFaculty && (
          <button type="button" onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            {showForm ? 'Cancel' : 'Add Course'}
          </button>
        )}
      </div>
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-4 space-y-3 max-w-md">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
        </form>
      )}
      <div className="grid gap-4">
        {courses.map((c) => (
          <div key={c._id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-slate-800">{c.title}</h2>
              <p className="text-slate-600 text-sm">{c.description}</p>
              {c.faculty?.name && <p className="text-slate-500 text-xs">Faculty: {c.faculty.name}</p>}
            </div>
            <div className="flex gap-2">
              <Link to={`/outcomes?course=${c._id}`} className="px-3 py-1.5 text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 text-sm">Outcomes</Link>
              <Link to={`/assignments?course=${c._id}`} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm">Assignments</Link>
            </div>
          </div>
        ))}
        {!courses.length && <p className="text-slate-500">No courses yet.</p>}
      </div>
    </div>
  );
}
