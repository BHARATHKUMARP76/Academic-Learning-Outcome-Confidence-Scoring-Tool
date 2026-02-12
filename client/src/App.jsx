import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Toast from './components/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Assignments from './pages/Assignments';
import Submissions from './pages/Submissions';
import SubmitAssignment from './pages/SubmitAssignment';
import Outcomes from './pages/Outcomes';
import Users from './pages/Users';
import Analytics from './pages/Analytics';
import Notifications from './pages/Notifications';

function PrivateLayout() {
  return (
    <ProtectedRoute>
      <DashboardLayout />
    </ProtectedRoute>
  );
}

function StudentOnly({ children }) {
  return <ProtectedRoute allowedRoles={['student']}>{children}</ProtectedRoute>;
}

function FacultyOnly({ children }) {
  return <ProtectedRoute allowedRoles={['faculty', 'admin']}>{children}</ProtectedRoute>;
}

function AdminOnly({ children }) {
  return <ProtectedRoute allowedRoles={['admin']}>{children}</ProtectedRoute>;
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<PrivateLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="courses" element={<Courses />} />
              <Route path="assignments" element={<Assignments />} />
              <Route path="submissions" element={<Submissions />} />
              <Route path="submit" element={<StudentOnly><SubmitAssignment /></StudentOnly>} />
              <Route path="outcomes" element={<FacultyOnly><Outcomes /></FacultyOnly>} />
              <Route path="users" element={<AdminOnly><Users /></AdminOnly>} />
              <Route path="analytics" element={<AdminOnly><Analytics /></AdminOnly>} />
              <Route path="notifications" element={<Notifications />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toast />
      </ToastProvider>
    </AuthProvider>
  );
}
