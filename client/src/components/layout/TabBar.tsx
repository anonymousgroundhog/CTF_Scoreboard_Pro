import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { TabName } from '../../types/index';
import ServerSettings from './ServerSettings';

const tabs: { name: TabName; label: string; icon: string }[] = [
  { name: 'leaderboard', label: 'Leaderboard', icon: '🏆' },
  { name: 'dataentry', label: 'Data Entry', icon: '📝' },
  { name: 'scores', label: 'Scores', icon: '📊' },
  { name: 'scoring', label: 'Uptime Scoring', icon: '🔍' },
  { name: 'management', label: 'Management', icon: '⚙️' },
];

export default function TabBar() {
  const { activeTab, setActiveTab } = useStore();
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="bg-cyber-surface border-b border-cyber-border px-6 flex items-center justify-between">
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`tab-button ${activeTab === tab.name ? 'tab-button-active' : ''}`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="text-cyber-muted hover:text-cyber-accent text-xl transition-colors"
          title="Server Settings"
        >
          ⚙️
        </button>
      </div>

      {showSettings && <ServerSettings onClose={() => setShowSettings(false)} />}
    </>
  );
}
