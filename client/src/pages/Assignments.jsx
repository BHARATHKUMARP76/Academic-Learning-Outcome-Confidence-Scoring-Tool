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
  const [outcomes, setOutcomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: '',
    description: '',
    course: '',
    totalMarks: '',
    dueDate: '',
    type: 'assignment',
    correctAnswer: '',
    questions: []
  });
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
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

  useEffect(() => {
    if (!isFaculty || !courseId) {
      setOutcomes([]);
      return;
    }
    api.get('/outcomes/' + courseId).then((res) => setOutcomes(res.data || [])).catch(() => setOutcomes([]));
  }, [courseId, isFaculty]);

  const quizTotal = (form.questions || []).length;

  const addQuestion = () => {
    setForm((f) => ({
      ...f,
      questions: [
        ...(f.questions || []),
        {
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: ''
        }
      ]
    }));
  };

  const removeQuestion = (idx) => {
    setForm((f) => ({ ...f, questions: (f.questions || []).filter((_, i) => i !== idx) }));
  };

  const updateQuestion = (idx, patch) => {
    setForm((f) => ({
      ...f,
      questions: (f.questions || []).map((q, i) => (i === idx ? { ...q, ...patch } : q))
    }));
  };

  const handleCreate = (e) => {
    e.preventDefault();
    const selectedCourse = courses.find((c) => c._id === courseId);
    const autoTitle =
      (form.title || '').trim() || `MCQ Quiz - ${selectedCourse?.title || 'Course'}`;
    const autoDescription =
      (form.description || '').trim() || 'MCQ quiz created in the confidence tracker system.';
    const autoDueDate = form.dueDate || new Date().toISOString();

    if (quizTotal < 1) {
      addToast('Add at least one MCQ question.', 'error');
      return;
    }

    const payload = {
      title: autoTitle,
      description: autoDescription,
      course: courseId,
      dueDate: autoDueDate,
      type: 'quiz',
      totalMarks: quizTotal,
      questions: (form.questions || []).map((q) => ({
        questionText: q.questionText,
        options: [q.optionA, q.optionB, q.optionC, q.optionD]
          .map((o) => String(o || '').trim())
          .filter(Boolean),
        correctAnswer: q.correctAnswer || '',
        marks: 1
      }))
    };

    api.post('/assignments', payload).then((res) => {
      setAssignments((prev) => [res.data, ...prev]);
      setForm({
        title: '',
        description: '',
        course: '',
        totalMarks: '',
        dueDate: '',
        type: 'assignment',
        correctAnswer: '',
        questions: []
      });
      setShowForm(false);
      addToast('Created successfully', 'success');
    }).catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'));
  };

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingId) return;
    if (quizTotal < 1) {
      addToast('Add at least one MCQ question.', 'error');
      return;
    }

    const autoTitle = (form.title || '').trim() || 'MCQ Quiz';
    const autoDescription = (form.description || '').trim() || '';
    const autoDueDate = form.dueDate || new Date().toISOString();

    const payload = {
      title: autoTitle,
      description: autoDescription,
      dueDate: autoDueDate,
      type: 'quiz',
      totalMarks: quizTotal,
      questions: (form.questions || []).map((q) => ({
        questionText: q.questionText,
        options: [q.optionA, q.optionB, q.optionC, q.optionD]
          .map((o) => String(o || '').trim())
          .filter(Boolean),
        correctAnswer: q.correctAnswer || '',
        marks: 1
      }))
    };
    api.put('/assignments/' + editingId, payload).then((res) => {
      setAssignments((prev) => prev.map((a) => (a._id === editingId ? res.data : a)));
      setEditingId(null);
      setForm({
        title: '',
        description: '',
        course: '',
        totalMarks: '',
        dueDate: '',
        type: 'assignment',
        correctAnswer: '',
        questions: []
      });
      addToast('Updated successfully', 'success');
    }).catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'));
  };

  const startEdit = (a) => {
    setEditingId(a._id);
    setForm({
      title: a.title,
      description: a.description || '',
      course: a.course?._id || a.course || '',
      totalMarks: a.totalMarks ?? '',
      dueDate: a.dueDate ? new Date(a.dueDate).toISOString().slice(0, 16) : '',
      type: a.type || 'assignment',
      correctAnswer: a.correctAnswer || '',
      questions: Array.isArray(a.questions)
        ? a.questions.map((q) => ({
            questionText: q.questionText || '',
            optionA: Array.isArray(q.options) && q.options.length > 0 ? q.options[0] : '',
            optionB: Array.isArray(q.options) && q.options.length > 1 ? q.options[1] : '',
            optionC: Array.isArray(q.options) && q.options.length > 2 ? q.options[2] : '',
            optionD: Array.isArray(q.options) && q.options.length > 3 ? q.options[3] : '',
            correctAnswer: q.correctAnswer || ''
          }))
        : []
    });
  };

  if (loading && !assignments.length) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">MCQ Bank</h1>
      <div className="flex gap-4 items-center flex-wrap">
        <label className="text-slate-700">Course:</label>
        <select
          value={courseId || ''}
          onChange={(e) => (window.location.href = e.target.value ? `/assignments?course=${e.target.value}` : '/assignments')}
          className="px-3 py-2 border border-slate-300 rounded-lg"
        >
          <option value="">Select course</option>
          {courses.map((c) => (
            <option key={c._id} value={c._id}>{c.title}</option>
          ))}
        </select>
        {isFaculty && courseId && (
          <button type="button" onClick={() => { setShowForm(!showForm); setEditingId(null); }} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
            {showForm ? 'Cancel' : 'Create MCQ Quiz'}
          </button>
        )}
      </div>
      {(showForm || editingId) && courseId && (
        <form onSubmit={editingId ? handleUpdate : handleCreate} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3 max-w-md">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700">
            Total marks (auto from MCQs): <strong>{quizTotal}</strong>
          </div>

          {isFaculty && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">MCQ Questions</h3>
                <button type="button" onClick={addQuestion} className="px-3 py-1.5 bg-slate-800 text-white rounded-lg text-sm hover:bg-slate-900">
                  Add question
                </button>
              </div>
              {(form.questions || []).length === 0 && (
                <p className="text-sm text-slate-500">
                  Add multiple MCQ questions. Each MCQ is worth 1 mark, and total marks are calculated automatically.
                </p>
              )}
              {(form.questions || []).map((q, idx) => (
                <div key={idx} className="border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <p className="font-medium text-slate-800">Question {idx + 1}</p>
                    <button type="button" onClick={() => removeQuestion(idx)} className="text-sm text-red-600 hover:underline">
                      Remove
                    </button>
                  </div>

                  <input
                    value={q.questionText}
                    onChange={(e) => updateQuestion(idx, { questionText: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Question text"
                  />

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-700">Options (A–D)</p>
                    <div className="grid grid-cols-1 gap-2">
                      <input
                        value={q.optionA || ''}
                        onChange={(e) => updateQuestion(idx, { optionA: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Option A"
                      />
                      <input
                        value={q.optionB || ''}
                        onChange={(e) => updateQuestion(idx, { optionB: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Option B"
                      />
                      <input
                        value={q.optionC || ''}
                        onChange={(e) => updateQuestion(idx, { optionC: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Option C"
                      />
                      <input
                        value={q.optionD || ''}
                        onChange={(e) => updateQuestion(idx, { optionD: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg"
                        placeholder="Option D"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correct answer</label>
                    <select
                      value={q.correctAnswer || ''}
                      onChange={(e) => updateQuestion(idx, { correctAnswer: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg"
                    >
                      <option value="">Select correct option</option>
                      {q.optionA && (
                        <option value={q.optionA}>A</option>
                      )}
                      {q.optionB && (
                        <option value={q.optionB}>B</option>
                      )}
                      {q.optionC && (
                        <option value={q.optionC}>C</option>
                      )}
                      {q.optionD && (
                        <option value={q.optionD}>D</option>
                      )}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', description: '', course: '', totalMarks: '', dueDate: '', type: 'assignment', correctAnswer: '', questions: [] }); }} className="px-4 py-2 border rounded-lg">Cancel</button>}
          </div>
        </form>
      )}
      {courseId && (
        <div className="grid gap-4">
          {assignments.map((a) => (
            <div key={a._id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-semibold text-slate-800">{a.title}</h2>
                  <span className="text-xs uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">{a.type || 'assignment'}</span>
                </div>
                <p className="text-slate-600 text-sm">{a.description}</p>
                <p className="text-slate-500 text-xs">Total: {a.totalMarks} · Due: {new Date(a.dueDate).toLocaleDateString()}</p>
              </div>
              <div className="flex gap-2">
                {user?.role === 'student' && (
                  <Link to={`/submit?assignment=${a._id}`} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">Submit</Link>
                )}
                {isFaculty && (
                  <button type="button" onClick={() => startEdit(a)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-sm hover:bg-slate-50">Edit</button>
                )}
              </div>
            </div>
          ))}
          {!assignments.length && <p className="text-slate-500">No assignments in this course.</p>}
        </div>
      )}
      {!courseId && <p className="text-slate-500">Select a course to view assignments.</p>}
    </div>
  );
}
