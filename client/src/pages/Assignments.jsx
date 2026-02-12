import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Assignments() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');
  const { user } = useAuth();
  const { addToast } = useToast();
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', course: '', totalMarks: '', dueDate: '' });
  const [showForm, setShowForm] = useState(false);
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  useEffect(() => {
    api.get('/courses').then((res) => setCourses(res.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (courseId) {
      setLoading(true);
      api.get(`/assignments/${courseId}`).then((res) => setAssignments(res.data)).catch(() => setAssignments([])).finally(() => setLoading(false));
    } else {
      setAssignments([]);
    }
  }, [courseId]);

  const handleCreate = (e) => {
    e.preventDefault();
    const payload = { ...form, course: courseId, totalMarks: Number(form.totalMarks), dueDate: form.dueDate };
    api.post('/assignments', payload).then((res) => {
      setAssignments((prev) => [res.data, ...prev]);
      setForm({ title: '', description: '', course: '', totalMarks: '', dueDate: '' });
      setShowForm(false);
      addToast('Assignment created', 'success');
    }).catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'));
  };

  if (loading && !assignments.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Assignments</h1>
      <div className="flex gap-4 items-center flex-wrap">
        <label className="text-slate-700">Course:</label>
        <select
          value={courseId || ''}
          onChange={(e) => (window.location.href = e.target.value ? `/assignments?course=${e.target.value}` : '/assignments')}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        {isFaculty && courseId && (
          <button type="button" onClick={() => setShowForm(!showForm)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
            {showForm ? 'Cancel' : 'Add Assignment'}
          </button>
        )}
      </div>
      {showForm && courseId && (
        <form onSubmit={handleCreate} className="bg-white rounded-xl border p-4 space-y-3 max-w-md">
          <input placeholder="Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required />
          <textarea placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" />
          <input type="number" placeholder="Total marks" value={form.totalMarks} onChange={(e) => setForm((f) => ({ ...f, totalMarks: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required />
          <input type="datetime-local" value={form.dueDate} onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))} className="w-full px-3 py-2 border rounded-lg" required />
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">Create</button>
        </form>
      )}
      {courseId && (
        <div className="grid gap-4">
          {assignments.map((a) => (
            <div key={a._id} className="bg-white rounded-xl border p-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h2 className="font-semibold text-slate-800">{a.title}</h2>
                <p className="text-slate-600 text-sm">{a.description}</p>
                <p className="text-slate-500 text-xs">Total: {a.totalMarks} · Due: {new Date(a.dueDate).toLocaleDateString()}</p>
              </div>
              {user?.role === 'student' && (
                <Link to={`/submit?assignment=${a._id}`} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm">Submit</Link>
              )}
            </div>
          ))}
          {!assignments.length && <p className="text-slate-500">No assignments in this course.</p>}
        </div>
      )}
      {!courseId && <p className="text-slate-500">Select a course to view assignments.</p>}
    </div>
  );
}
