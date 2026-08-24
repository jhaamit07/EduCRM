import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import LoginPage from '@/pages/LoginPage';
import AppLayout, { type PageKey } from '@/components/AppLayout';
import DashboardPage from '@/pages/DashboardPage';
import LeadsPage from '@/pages/LeadsPage';
import CoursesPage from '@/pages/CoursesPage';
import ProfitsPage from '@/pages/ProfitsPage';

function AppContent() {
  const { session, profile, loading } = useAuth();
  const [page, setPage] = useState<PageKey>('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  if (!session || !profile) {
    return <LoginPage />;
  }

  return (
    <AppLayout page={page} onNavigate={setPage}>
      {page === 'dashboard' && <DashboardPage onNavigate={setPage} />}
      {page === 'leads' && <LeadsPage />}
      {page === 'courses' && <CoursesPage />}
      {page === 'profits' && <ProfitsPage />}
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
