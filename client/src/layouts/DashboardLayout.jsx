import { useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const navStudent = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/assignments', label: 'Assignments' },
  { to: '/submissions', label: 'My Submissions' }
];

const navFaculty = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/courses', label: 'Courses' },
  { to: '/outcomes', label: 'Learning Outcomes' },
  { to: '/assignments', label: 'Assignments' },
  { to: '/submissions', label: 'Submissions' }
];

const navAdmin = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/users', label: 'Users' },
  { to: '/analytics', label: 'Analytics' }
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const nav = user?.role === 'admin' ? navAdmin : user?.role === 'faculty' ? navFaculty : navStudent;

  const handleLogout = () => {
    logout();
    addToast('Logged out successfully', 'success');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <aside
        className={`${
          sidebarOpen ? 'w-56' : 'w-16'
        } bg-slate-800 text-white transition-all duration-200 flex flex-col fixed h-full z-30`}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          {sidebarOpen && (
            <Link to="/dashboard" className="font-semibold text-lg truncate">
              Confidence Tool
            </Link>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 rounded hover:bg-slate-700"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm ${
                  isActive ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`
              }
            >
              {sidebarOpen ? item.label : item.label.charAt(0)}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className={`flex-1 ${sidebarOpen ? 'ml-56' : 'ml-16'} transition-all duration-200 flex flex-col`}>
        <header className="bg-white border-b border-slate-200 h-14 flex items-center justify-between px-4 sticky top-0 z-20">
          <h1 className="text-slate-800 font-medium truncate">{user?.name}</h1>
          <div className="flex items-center gap-2">
            <Link
              to="/notifications"
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-600"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              Notifications
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm"
            >
              Logout
            </button>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
