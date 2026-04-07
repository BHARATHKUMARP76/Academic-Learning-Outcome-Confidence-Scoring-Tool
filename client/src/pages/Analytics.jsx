import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

const COLORS = ['#ef4444', '#eab308', '#22c55e'];

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [courseData, setCourseData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/analytics/institution').then((res) => setData(res.data)).catch(() => setData(null)).finally(() => setLoading(false));
    } else if (user?.role === 'faculty' || user?.role === 'admin') {
      api.get('/courses').then((res) => {
        setCourses(res.data || []);
        if (res.data?.length && !selectedCourse) setSelectedCourse(res.data[0]._id);
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    if ((user?.role === 'faculty' || user?.role === 'admin') && selectedCourse) {
      api.get(`/analytics/course/${selectedCourse}`).then((res) => setCourseData(res.data)).catch(() => setCourseData(null));
    }
  }, [selectedCourse, user?.role]);

  if (loading) return <LoadingSpinner />;
  if (user?.role === 'student') {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-slate-600">View your <a href="/performance" className="text-indigo-600 underline">Performance &amp; Confidence</a> for analytics.</p>
      </div>
    );
  }

  const isAdmin = user?.role === 'admin';
  const trend = (isAdmin ? data?.trend : courseData?.confidenceTrend) || [];
  const attendanceTrend = (isAdmin ? data?.attendanceTrend : courseData?.attendanceTrend) || [];
  const distribution = isAdmin ? data?.distribution : courseData?.distribution;
  const assignmentVsQuiz = courseData?.assignmentVsQuizPerformance || (isAdmin ? [] : []);
  const mcqAccuracyCourse = courseData?.mcqAccuracy || [];
  const mcqAccuracyInstitution = typeof data?.mcqAccuracy === 'number' ? [{ assignment: 'All Quizzes', accuracy: data.mcqAccuracy }] : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">{isAdmin ? 'Institution Analytics' : 'Course Analytics'}</h1>

      {isAdmin && data && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-slate-500 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-indigo-600">{data.totalStudents ?? 0}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-slate-500 text-sm">Avg Confidence Score</p>
              <p className="text-2xl font-bold text-slate-800">{data.avgConfidenceScore ?? '—'}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <p className="text-slate-500 text-sm">Weak Learner %</p>
              <p className="text-2xl font-bold text-red-600">{data.weakLearnerPercentage ?? 0}%</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <h2 className="font-semibold text-slate-800 mb-4">Performance Trend</h2>
            {trend.length ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trend}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="avgScore" stroke="#6366f1" name="Avg Score" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-500">No trend data yet.</p>
            )}
          </div>

          {attendanceTrend.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="font-semibold text-slate-800 mb-4">Attendance Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={attendanceTrend}>
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Area type="monotone" dataKey="attendance" stroke="#22c55e" fill="#22c55e33" name="Attendance %" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {distribution && (distribution.weak > 0 || distribution.medium > 0 || distribution.strong > 0) && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="font-semibold text-slate-800 mb-4">Weak / Medium / Strong Distribution</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Weak', value: distribution.weak, color: COLORS[0] },
                      { name: 'Medium', value: distribution.medium, color: COLORS[1] },
                      { name: 'Strong', value: distribution.strong, color: COLORS[2] }
                    ].filter((d) => d.value > 0)}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label
                  >
                    {[
                      { name: 'Weak', value: distribution.weak, color: COLORS[0] },
                      { name: 'Medium', value: distribution.medium, color: COLORS[1] },
                      { name: 'Strong', value: distribution.strong, color: COLORS[2] }
                    ].filter((d) => d.value > 0).map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {mcqAccuracyInstitution.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h2 className="font-semibold text-slate-800 mb-4">MCQ Accuracy Analytics</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={mcqAccuracyInstitution}>
                  <XAxis dataKey="assignment" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="accuracy" fill="#22c55e" name="Accuracy %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {(user?.role === 'faculty' || (user?.role === 'admin' && courses.length)) && (
        <>
          {!isAdmin && (
            <div className="flex gap-4 flex-wrap items-center">
              <label className="text-slate-700 font-medium">Course:</label>
              <select value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)} className="px-3 py-2 border border-slate-300 rounded-lg">
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>{c.title}</option>
                ))}
              </select>
            </div>
          )}

          {courseData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {courseData.byAssignment?.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h2 className="font-semibold text-slate-800 mb-4">Performance by Assignment</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={courseData.byAssignment}>
                        <XAxis dataKey="assignment" tick={{ fontSize: 11 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="avgScore" fill="#6366f1" name="Avg Score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {assignmentVsQuiz.length > 0 && (
                  <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                    <h2 className="font-semibold text-slate-800 mb-4">Assignment vs Quiz Performance</h2>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={assignmentVsQuiz}>
                        <XAxis dataKey="type" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="avgScore" fill="#8b5cf6" name="Avg score" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
              {attendanceTrend.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h2 className="font-semibold text-slate-800 mb-4">Attendance Trend</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={attendanceTrend}>
                      <XAxis dataKey="date" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Area type="monotone" dataKey="attendance" stroke="#22c55e" fill="#22c55e33" name="Attendance %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
              {courseData.confidenceTrend?.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h2 className="font-semibold text-slate-800 mb-4">Confidence Score Trend</h2>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={courseData.confidenceTrend}>
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="avgScore" stroke="#6366f1" name="Avg Score" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
              {distribution && (distribution.weak > 0 || distribution.medium > 0 || distribution.strong > 0) && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h2 className="font-semibold text-slate-800 mb-4">Weak / Medium / Strong Distribution</h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Weak', value: distribution.weak, color: COLORS[0] },
                          { name: 'Medium', value: distribution.medium, color: COLORS[1] },
                          { name: 'Strong', value: distribution.strong, color: COLORS[2] }
                        ].filter((d) => d.value > 0)}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label
                      >
                        {[
                          { name: 'Weak', value: distribution.weak, color: COLORS[0] },
                          { name: 'Medium', value: distribution.medium, color: COLORS[1] },
                          { name: 'Strong', value: distribution.strong, color: COLORS[2] }
                        ].filter((d) => d.value > 0).map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {mcqAccuracyCourse.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <h2 className="font-semibold text-slate-800 mb-4">MCQ Accuracy Analytics</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={mcqAccuracyCourse}>
                      <XAxis dataKey="assignment" tick={{ fontSize: 11 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="accuracy" fill="#22c55e" name="Accuracy %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
