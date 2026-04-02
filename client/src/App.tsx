import { useEffect, useState } from 'react';
import { useStore } from './store/useStore';
import { verifyToken } from './api/client';
import Leaderboard from './pages/Leaderboard';
import DataEntry from './pages/DataEntry';
import Scores from './pages/Scores';
import Scoring from './pages/Scoring';
import Management from './pages/Management';
import StatusToast from './components/ui/StatusToast';
import TabBar from './components/layout/TabBar';
import LoginModal from './components/auth/LoginModal';

export default function App() {
  const { loadState, activeTab, setActiveTab, toasts } = useStore();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Check if already logged in
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const result = await verifyToken(token);
        if (result.valid) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('auth_token');
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  useEffect(() => {
    loadState();
    // Refresh state every 10 seconds
    const interval = setInterval(() => {
      loadState();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadState]);

  const handleLogin = (token: string) => {
    setIsAuthenticated(true);
    // Redirect to Data Entry or Leaderboard
    setActiveTab('leaderboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    setIsAuthenticated(false);
    setActiveTab('leaderboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cyber-bg flex items-center justify-center">
        <div className="text-cyber-accent text-2xl font-bold">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text font-sans">
      {/* Show login modal only for protected tabs when not authenticated */}
      {!isAuthenticated && activeTab !== 'leaderboard' && <LoginModal onLogin={handleLogin} />}

      <div className="min-h-screen flex flex-col">
        <TabBar isAuthenticated={isAuthenticated} onLogout={handleLogout} />
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'leaderboard' && <Leaderboard />}
          {isAuthenticated && activeTab === 'dataentry' && <DataEntry />}
          {isAuthenticated && activeTab === 'scores' && <Scores />}
          {isAuthenticated && activeTab === 'scoring' && <Scoring />}
          {isAuthenticated && activeTab === 'management' && <Management />}

          {/* Show message if trying to access protected tab without auth */}
          {!isAuthenticated && activeTab !== 'leaderboard' && (
            <div className="flex items-center justify-center min-h-96">
              <div className="text-center space-y-4">
                <div className="text-6xl">🔒</div>
                <h2 className="text-2xl font-bold text-cyber-accent">Login Required</h2>
                <p className="text-cyber-muted">This section requires authentication</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Toast notifications */}
      <div className="fixed bottom-6 right-6 space-y-2 z-50">
        {toasts.map((toast) => (
          <StatusToast key={toast.id} toast={toast} />
        ))}
      </div>
    </div>
  );
}
