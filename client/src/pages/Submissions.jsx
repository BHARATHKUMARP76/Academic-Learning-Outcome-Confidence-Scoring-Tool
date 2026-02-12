import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Submissions() {
  const [searchParams] = useSearchParams();
  const courseId = searchParams.get('course');
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'student') {
      api.get(`/submissions/student/${user._id}`).then((res) => setSubmissions(res.data)).catch(() => setSubmissions([])).finally(() => setLoading(false));
    } else {
      api.get('/courses').then((res) => setCourses(res.data)).finally(() => setLoading(false));
    }
  }, [user?._id, user?.role]);

  useEffect(() => {
    if (user?.role !== 'student' && courseId) {
      setLoading(true);
      api.get(`/submissions/course/${courseId}`).then((res) => setSubmissions(res.data)).catch(() => setSubmissions([])).finally(() => setLoading(false));
    }
  }, [courseId, user?.role]);

  if (loading) return <LoadingSpinner />;

  if (user?.role !== 'student' && !courseId) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Submissions</h1>
        <p className="text-slate-600">Select a course:</p>
        <div className="flex flex-wrap gap-2">
          {courses.map((c) => (
            <Link key={c._id} to={`/submissions?course=${c._id}`} className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{c.title}</Link>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{user?.role === 'student' ? 'My Submissions' : 'Course Submissions'}</h1>
      <div className="grid gap-4">
        {submissions.map((s) => (
          <div key={s._id} className="bg-white rounded-xl border p-4 flex justify-between items-center flex-wrap gap-2">
            <div>
              <h2 className="font-semibold text-slate-800">{s.assignment?.title}</h2>
              {s.student?.name && <p className="text-slate-600 text-sm">Student: {s.student.name}</p>}
              <p className="text-slate-500 text-xs">
                Marks: {s.marksObtained} / {s.assignment?.totalMarks} · Confidence: {s.confidenceLevel}/5 · Score: {s.calculatedConfidenceScore?.toFixed(1)} · {s.learningStrength}
              </p>
            </div>
            <span className={`px-2 py-1 rounded text-xs ${s.learningStrength === 'Strong' ? 'bg-green-100 text-green-800' : s.learningStrength === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
              {s.learningStrength}
            </span>
          </div>
        ))}
        {!submissions.length && <p className="text-slate-500">No submissions.</p>}
      </div>
    </div>
  );
}
