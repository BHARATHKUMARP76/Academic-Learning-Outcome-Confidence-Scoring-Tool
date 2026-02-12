import { useEffect, useState } from 'react';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/notifications').then((res) => setNotifications(res.data)).catch(() => setNotifications([])).finally(() => setLoading(false));
  }, []);

  const markRead = (id) => {
    api.patch(`/notifications/${id}/read`).then(() => setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))).catch(() => {});
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
      <div className="grid gap-2">
        {notifications.map((n) => (
          <div key={n._id} className={`rounded-xl border p-4 ${n.read ? 'bg-slate-50' : 'bg-white'}`}>
            <h3 className="font-medium text-slate-800">{n.title}</h3>
            <p className="text-slate-600 text-sm">{n.message}</p>
            <p className="text-slate-400 text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
            {!n.read && (
              <button type="button" onClick={() => markRead(n._id)} className="mt-2 text-indigo-600 text-sm hover:underline">Mark as read</button>
            )}
          </div>
        ))}
        {!notifications.length && <p className="text-slate-500">No notifications.</p>}
      </div>
    </div>
  );
}
