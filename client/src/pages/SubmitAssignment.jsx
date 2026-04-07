import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SubmitAssignment() {
  const [searchParams] = useSearchParams();
  const assignmentId = searchParams.get('assignment');
  const { addToast } = useToast();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [answer, setAnswer] = useState('');
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [confidenceLevel, setConfidenceLevel] = useState(3);
  const [result, setResult] = useState(null);

  useEffect(() => {
    if (!assignmentId) {
      setLoading(false);
      return;
    }
    api.get('/assignments/single/' + assignmentId)
      .then((res) => {
        setAssignment(res.data);
        if (res.data?.type === 'quiz' && Array.isArray(res.data.questions)) {
          setMcqAnswers({});
        }
      })
      .catch(() => setAssignment(null))
      .finally(() => setLoading(false));
  }, [assignmentId]);

  const isQuiz = assignment?.type === 'quiz';
  const questions = useMemo(() => (Array.isArray(assignment?.questions) ? assignment.questions : []), [assignment]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isQuiz && (confidenceLevel < 1 || confidenceLevel > 5)) {
      addToast('Confidence level must be between 1 and 5', 'error');
      return;
    }
    setSubmitting(true);
    const payload = {
      assignment: assignmentId
    };
    if (isQuiz) {
      const answers = Object.entries(mcqAnswers)
        .filter(([, selectedOption]) => selectedOption != null && String(selectedOption).trim() !== '')
        .map(([questionId, selectedOption]) => ({ questionId, selectedOption: String(selectedOption).trim() }));
      payload.answers = answers;
    } else {
      payload.confidenceLevel = confidenceLevel;
      payload.answer = answer.trim();
    }

    api.post('/submissions', payload)
      .then((res) => {
        setResult(res.data);
        addToast('Submission recorded. Marks and confidence score are calculated by the system.', 'success');
      })
      .catch((err) => addToast(err.response?.data?.message || 'Failed', 'error'))
      .finally(() => setSubmitting(false));
  };

  if (loading) return <LoadingSpinner />;
  if (!assignment) return <p className="text-slate-500">Assignment not found.</p>;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Submit: {assignment.title}</h1>
      <p className="text-slate-600">Total marks: {assignment.totalMarks} (system-calculated after submission)</p>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
        {!isQuiz && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Your answer</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              rows={4}
              placeholder="Enter your answer or response..."
            />
          </div>
        )}

        {isQuiz && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Select one option for each question.</p>
            {questions.map((q, idx) => (
              <div key={q._id || idx} className="border border-slate-200 rounded-xl p-4">
                <p className="font-medium text-slate-800">{idx + 1}. {q.questionText}</p>
                <div className="mt-3 space-y-2">
                  {(q.options || []).map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-slate-700">
                      <input
                        type="radio"
                        name={`q-${q._id}`}
                        value={opt}
                        checked={(mcqAnswers[q._id] || '') === opt}
                        onChange={() => setMcqAnswers((prev) => ({ ...prev, [q._id]: opt }))}
                        className="accent-indigo-600"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            {questions.length === 0 && (
              <p className="text-slate-500 text-sm">This quiz has no questions yet.</p>
            )}
          </div>
        )}

        {!isQuiz && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Confidence level (1–5)</label>
            <select
              value={confidenceLevel}
              onChange={(e) => setConfidenceLevel(Number(e.target.value))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg"
            >
              <option value={1}>1</option>
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
            </select>
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {result && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-2">
          <h2 className="font-semibold text-slate-800">{isQuiz ? 'Quiz Result' : 'Submission result (read-only)'}</h2>
          {isQuiz ? (
            <>
              <p className="text-slate-700">
                Total questions: <strong>{result.totalQuestions ?? questions.length}</strong>
              </p>
              <p className="text-slate-700">
                Correct answers:{' '}
                <strong>{result.correctAnswers != null ? result.correctAnswers : result.marksObtained ?? '—'}</strong>
              </p>
              <p className="text-slate-700">
                Percentage:{' '}
                <strong>
                  {result.performancePercentage != null
                    ? `${Math.round(result.performancePercentage)}%`
                    : result.percentage != null
                    ? `${Math.round(result.percentage)}%`
                    : '—'}
                </strong>
              </p>
              <p className="text-slate-700">
                Confidence Level:{' '}
                <strong>{result.confidenceLevel != null ? result.confidenceLevel : '—'}</strong>
              </p>
            </>
          ) : (
            <>
              <p className="text-slate-700">
                Marks:{' '}
                <strong>{result.marksObtained ?? '—'}</strong> /{' '}
                {result.assignment?.totalMarks ?? assignment.totalMarks}
              </p>
              <p className="text-slate-700">
                Final confidence score:{' '}
                <strong>
                  {result.calculatedConfidenceScore != null
                    ? Number(result.calculatedConfidenceScore).toFixed(1)
                    : '—'}
                </strong>
              </p>
              <p className="text-slate-700">
                Confidence level: <strong>{result.confidenceLevel ?? '—'}</strong>
              </p>
              <p className="text-slate-700">
                Learning strength: <strong>{result.learningStrength ?? '—'}</strong>
              </p>
            </>
          )}
          <div className="pt-2 flex gap-2 flex-wrap">
            <Link to="/submissions" className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-900">View submissions</Link>
            <Link to={`/assignments?course=${assignment.course?._id || assignment.course || ''}`} className="px-4 py-2 border rounded-lg hover:bg-slate-50">Back to list</Link>
          </div>
        </div>
      )}
    </div>
  );
}
