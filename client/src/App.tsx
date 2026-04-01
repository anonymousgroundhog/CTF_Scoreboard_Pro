import { useEffect } from 'react';
import { useStore } from './store/useStore';
import Leaderboard from './pages/Leaderboard';
import DataEntry from './pages/DataEntry';
import Scores from './pages/Scores';
import Scoring from './pages/Scoring';
import Management from './pages/Management';
import StatusToast from './components/ui/StatusToast';
import TabBar from './components/layout/TabBar';

export default function App() {
  const { loadState, activeTab, toasts } = useStore();

  useEffect(() => {
    loadState();
    // Refresh state every 10 seconds
    const interval = setInterval(() => {
      loadState();
    }, 10000);
    return () => clearInterval(interval);
  }, [loadState]);

  return (
    <div className="min-h-screen bg-cyber-bg text-cyber-text font-sans">
      <div className="min-h-screen flex flex-col">
        <TabBar />
        <main className="flex-1 p-6 overflow-auto">
          {activeTab === 'leaderboard' && <Leaderboard />}
          {activeTab === 'dataentry' && <DataEntry />}
          {activeTab === 'scores' && <Scores />}
          {activeTab === 'scoring' && <Scoring />}
          {activeTab === 'management' && <Management />}
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
