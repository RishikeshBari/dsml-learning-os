import { AuthScreen } from './components/AuthScreen';
import { DashboardShell } from './components/DashboardShell';
import { LoadingScreen } from './components/LoadingScreen';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <DashboardShell />;
}
