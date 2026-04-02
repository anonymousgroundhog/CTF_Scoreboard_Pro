import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { TabName } from '../../types/index';
import ServerSettings from './ServerSettings';

interface TabBarProps {
  isAuthenticated: boolean;
  onLogout: () => void;
}

const protectedTabs: { name: TabName; label: string; icon: string }[] = [
  { name: 'dataentry', label: 'Data Entry', icon: '📝' },
  { name: 'scores', label: 'Scores', icon: '📊' },
  { name: 'scoring', label: 'Uptime Scoring', icon: '🔍' },
  { name: 'management', label: 'Management', icon: '⚙️' },
];

export default function TabBar({ isAuthenticated, onLogout }: TabBarProps) {
  const { activeTab, setActiveTab } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  const tabs = [
    { name: 'leaderboard' as TabName, label: 'Leaderboard', icon: '🏆', public: true },
    ...protectedTabs.map((t) => ({ ...t, public: false })),
  ];

  const handleTabClick = (tabName: TabName) => {
    setActiveTab(tabName);
  };

  return (
    <>
      <div className="bg-cyber-surface border-b border-cyber-border px-6 flex items-center justify-between">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => handleTabClick(tab.name)}
              className={`tab-button ${activeTab === tab.name ? 'tab-button-active' : ''}`}
              title={tab.name !== 'leaderboard' ? '🔒 Login may be required' : ''}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated && (
            <button
              onClick={onLogout}
              className="text-cyber-yellow hover:text-cyber-accent text-sm font-bold px-3 py-2 rounded border border-cyber-yellow hover:border-cyber-accent transition-colors"
              title="Logout"
            >
              Logout
            </button>
          )}
          <button
            onClick={() => setShowSettings(true)}
            className="text-cyber-muted hover:text-cyber-accent text-xl transition-colors"
            title="Server Settings"
          >
            ⚙️
          </button>
        </div>
      </div>

      {showSettings && <ServerSettings onClose={() => setShowSettings(false)} />}
    </>
  );
}
