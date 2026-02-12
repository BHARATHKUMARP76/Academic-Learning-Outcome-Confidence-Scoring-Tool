import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SubmitAssignment() {
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [marksObtained, setMarksObtained] = useState('');
  const [confidenceLevel, setConfidenceLevel] = useState(3);

  useEffect(() => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }
    const url = '/assignments/single/' + assignmentId;
    api.get(url).then((res) => setAssignment(res.data)).catch(() => setAssignment(null)).finally(() => setLoading(false));
  }, [assignmentId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const marks = Number(marksObtained);
    if (assignment && (marks < 0 || marks > assignment.totalMarks)) {
      addToast('Invalid marks', 'error');
      return;
    }
    setSubmitting(true);
    api.post('/submissions', { assignment: assignmentId, marksObtained: marks, confidenceLevel })
      .then(() => {
        addToast('Submission recorded', 'success');
        navigate('/submissions');
      })
      .catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <LoadingSpinner />;
  if (!assignment) return <p className="text-slate-500">Assignment not found.</p>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Submit: {assignment.title}</h1>
      <p className="text-slate-600">Total marks: {assignment.totalMarks}</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Marks obtained</label>
          <input type="number" min={0} max={assignment.totalMarks} value={marksObtained} onChange={(e) => setMarksObtained(e.target.value)} className="w-full px-3 py-2 border rounded-lg" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Confidence level (1-5)</label>
          <select value={confidenceLevel} onChange={(e) => setConfidenceLevel(Number(e.target.value))} className="w-full px-3 py-2 border rounded-lg">
            <option value={1}>1</option>
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
          </select>
        </div>
        <button type="submit" disabled={submitting} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  );
}
