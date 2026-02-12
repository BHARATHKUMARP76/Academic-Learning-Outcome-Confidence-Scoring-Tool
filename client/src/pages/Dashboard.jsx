import { useAuth } from '../context/AuthContext';
import DashboardStudent from './DashboardStudent';
import DashboardFaculty from './DashboardFaculty';
import DashboardAdmin from './DashboardAdmin';

export default function Dashboard() {
  const { user } = useAuth();
  if (user?.role === 'admin') return <DashboardAdmin />;
  if (user?.role === 'faculty') return <DashboardFaculty />;
  return <DashboardStudent />;
}
