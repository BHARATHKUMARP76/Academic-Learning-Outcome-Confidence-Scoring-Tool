import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Attendance() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [records, setRecords] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [courseRecords, setCourseRecords] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [percentage, setPercentage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const isFaculty = user?.role === 'faculty' || user?.role === 'admin';

  useEffect(() => {
    if (user?.role === 'student') {
      api.get('/attendance/me').then((res) => setRecords(res.data)).catch(() => setRecords([])).finally(() => setLoading(false));
    } else {
      Promise.all([
        api.get('/courses').then((res) => setCourses(res.data || [])),
        api.get('/users/students').then((res) => setStudents(res.data || [])).catch(() => setStudents([]))
      ]).finally(() => setLoading(false));
    }
  }, [user?.role]);

  useEffect(() => {
    if (!isFaculty || !selectedCourse) {
      setCourseRecords([]);
      return;
    }
    api.get('/attendance/course/' + selectedCourse).then((res) => setCourseRecords(res.data || [])).catch(() => setCourseRecords([]));
  }, [isFaculty, selectedCourse]);

  const handleSetAttendance = (e) => {
    e.preventDefault();
    const p = Number(percentage);
    if (p < 0 || p > 100) {
      addToast('Attendance must be between 0 and 100', 'error');
      return;
    }
    if (!selectedStudent || !selectedCourse) {
      addToast('Select student and course', 'error');
      return;
    }
    setSaving(true);
    api.put('/attendance', { student: selectedStudent, course: selectedCourse, percentage: p })
      .then(() => {
        addToast('Attendance updated', 'success');
        setPercentage('');
        setSelectedStudent('');
        return api.get('/attendance/course/' + selectedCourse);
      })
      .then((res) => setCourseRecords(res.data || []))
      .catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'))
      .finally(() => setSaving(false));
  };

  if (loading) return <LoadingSpinner />;

  if (user?.role === 'student') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">My Attendance</h1>
        <div className="grid gap-4">
          {records.length ? records.map((r) => (
            <div key={r._id || r.course?._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="font-semibold text-slate-800">{r.course?.title || 'Course'}</h2>
              <p className="text-slate-600 mt-1">Attendance: <strong>{r.percentage}%</strong></p>
            </div>
          )) : <p className="text-slate-500">No attendance records yet.</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Attendance Overview</h1>
      <div className="flex gap-4 flex-wrap items-center">
        <label className="text-slate-700 font-medium">Course:</label>
        <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg">
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
      </div>
      {selectedCourse && (
        <>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 max-w-md">
            <h2 className="font-semibold text-slate-800 mb-3">Set / Update Attendance</h2>
            <form onSubmit={handleSetAttendance} className="space-y-3">
              <div>
                <label className="block text-sm text-slate-600 mb-1">Student</label>
                <select value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required>
                  <option value="">Select student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-600 mb-1">Percentage (0–100)</label>
                <input type="number" min={0} max={100} value={percentage} onChange={(e) => setPercentage(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
              </div>
              <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50">Save</button>
            </form>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="font-semibold text-slate-800 mb-3">Attendance by student</h2>
            {courseRecords.length ? (
              <ul className="space-y-2">
                {courseRecords.map((r) => (
                  <li key={r._id} className="flex justify-between text-slate-700">
                    <span>{r.student?.name ?? r.student ?? r._id}</span>
                    <span className="font-medium">{r.percentage}%</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-slate-500">No attendance records for this course.</p>}
          </div>
        </>
      )}
    </div>
  );
}
