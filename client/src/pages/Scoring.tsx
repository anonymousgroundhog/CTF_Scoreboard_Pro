import { useEffect, useState } from 'react';
import { useStore } from '../store/useStore';

export default function Scoring() {
  const {
    teams,
    scoringConfig,
    loadScoringConfig,
    saveScoringConfig,
    getAvailableHosts,
    runScoring,
    syncScoringResults,
    resetScoringResults,
    autoRunInterval,
    setAutoRunInterval,
    loadState,
  } = useStore();

  const [hosts, setHosts] = useState<string[]>([]);
  const [config, setConfig] = useState<Record<string, string>>(scoringConfig);
  const [running, setRunning] = useState<string | null>(null);
  const [autoInterval, setAutoInterval] = useState<string>('60');
  const [isAutoRunning, setIsAutoRunning] = useState(!!autoRunInterval);
  const [customHostInput, setCustomHostInput] = useState<Record<string, string>>({}); // Track custom inputs
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetTeams, setResetTeams] = useState<'all' | 'selected'>('all');
  const [selectedTeamsForReset, setSelectedTeamsForReset] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadScoringConfig();
    fetchHosts();
  }, []);

  useEffect(() => {
    setConfig(scoringConfig);
  }, [scoringConfig]);

  const fetchHosts = async () => {
    try {
      const availableHosts = await getAvailableHosts();
      setHosts(availableHosts);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfigChange = (teamName: string, host: string) => {
    const updated = { ...config, [teamName]: host };
    setConfig(updated);
    setCustomHostInput({ ...customHostInput, [teamName]: host });
  };

  const handleCustomHostChange = (teamName: string, host: string) => {
    const updated = { ...config, [teamName]: host };
    setConfig(updated);
    setCustomHostInput({ ...customHostInput, [teamName]: host });
  };

  const handleSaveConfig = async () => {
    try {
      await saveScoringConfig(config);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRunScoring = async (host: string) => {
    setRunning(host);
    try {
      await runScoring(host);
      // Auto-sync results after a short delay to let script run
      setTimeout(() => {
        handleSync();
      }, 3000);
    } catch (err) {
      console.error(err);
    }
    setRunning(null);
  };

  const handleSync = async () => {
    try {
      await syncScoringResults();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReset = async () => {
    try {
      if (resetTeams === 'all') {
        await resetScoringResults();
      } else {
        await resetScoringResults(Array.from(selectedTeamsForReset));
      }
      setShowResetConfirm(false);
      setSelectedTeamsForReset(new Set());
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTeamForReset = (teamName: string) => {
    const updated = new Set(selectedTeamsForReset);
    if (updated.has(teamName)) {
      updated.delete(teamName);
    } else {
      updated.add(teamName);
    }
    setSelectedTeamsForReset(updated);
  };

  const handleToggleAutoRun = () => {
    if (isAutoRunning) {
      setAutoRunInterval(null);
      setIsAutoRunning(false);
    } else {
      const ms = parseInt(autoInterval) * 1000;
      if (ms > 0) {
        setAutoRunInterval(ms);
        setIsAutoRunning(true);
        // Start auto-run loop
        startAutoRun(ms);
      }
    }
  };

  const startAutoRun = (ms: number) => {
    // Run scoring for all configured hosts on interval
    const runAll = async () => {
      for (const host of Object.values(config)) {
        try {
          await runScoring(host);
        } catch (err) {
          console.error(err);
        }
      }
      // After all scoring completes, sync results
      await handleSync();
    };

    // Run immediately
    runAll();

    // Then set up interval
    const interval = setInterval(runAll, ms);
    return () => clearInterval(interval);
  };

  const teamList = Object.keys(teams).sort();
  const unmappedTeams = teamList.filter((t) => !config[t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cyber-accent">🔍 Uptime Scoring</h1>
        <button onClick={fetchHosts} className="btn-secondary text-sm py-2 px-3">
          Refresh Hosts
        </button>
      </div>

      {/* Auto-run control */}
      <div className="bg-cyber-surface rounded border border-cyber-border p-4 space-y-3">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAutoRunning}
              onChange={handleToggleAutoRun}
              className="w-5 h-5"
            />
            <span className="font-bold text-cyber-accent">Auto-run Scoring</span>
          </label>

          <div className="flex items-center gap-2">
            <label className="text-sm text-cyber-muted">Every</label>
            <input
              type="number"
              value={autoInterval}
              onChange={(e) => setAutoInterval(e.target.value)}
              min="10"
              max="3600"
              disabled={isAutoRunning}
              className="input-field w-20 text-sm"
            />
            <span className="text-sm text-cyber-muted">seconds</span>
          </div>

          <button onClick={handleSync} className="btn-primary text-sm py-2 px-4 ml-auto">
            Sync All Results Now
          </button>

          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-orange-600 hover:bg-orange-700 text-white text-sm py-2 px-4 rounded transition-all"
          >
            Reset Scores
          </button>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      {showResetConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cyber-surface border border-cyber-border rounded p-6 w-96 space-y-4">
            <h3 className="text-lg font-bold text-cyber-accent">Reset Uptime Scores</h3>
            <p className="text-cyber-muted text-sm">
              This will clear uptime scores to 0. You'll need to run the scoring script again to collect fresh data.
            </p>

            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="resetScope"
                  value="all"
                  checked={resetTeams === 'all'}
                  onChange={() => {
                    setResetTeams('all');
                    setSelectedTeamsForReset(new Set());
                  }}
                  className="w-4 h-4"
                />
                <span className="text-sm">Reset all teams</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="resetScope"
                  value="selected"
                  checked={resetTeams === 'selected'}
                  onChange={() => setResetTeams('selected')}
                  className="w-4 h-4"
                />
                <span className="text-sm">Reset selected teams only</span>
              </label>
            </div>

            {resetTeams === 'selected' && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {teamList.map((name) => (
                  <label key={name} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTeamsForReset.has(name)}
                      onChange={() => toggleTeamForReset(name)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">{name}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t border-cyber-border">
              <button
                onClick={() => {
                  setShowResetConfirm(false);
                  setSelectedTeamsForReset(new Set());
                }}
                className="btn-secondary flex-1 text-sm py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={resetTeams === 'selected' && selectedTeamsForReset.size === 0}
                className="bg-cyber-red hover:bg-red-600 text-white flex-1 text-sm py-2 rounded font-bold disabled:opacity-50"
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team-Host Mapping */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-cyber-accent">Team-Host Mapping</h2>
        <div className="bg-cyber-surface rounded border border-cyber-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left min-w-[150px]">Team Name</th>
                <th className="px-4 py-3 text-left min-w-[180px]">Assigned Host</th>
                <th className="px-4 py-3 text-center min-w-[100px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {teamList.map((teamName) => (
                <tr key={teamName} className="table-row">
                  <td className="table-cell font-bold">{teamName}</td>
                  <td className="table-cell">
                    <div className="relative">
                      <input
                        type="text"
                        value={customHostInput[teamName] || config[teamName] || ''}
                        onChange={(e) => handleCustomHostChange(teamName, e.target.value)}
                        placeholder="Type or select host..."
                        list={`hosts-${teamName}`}
                        className="input-field w-full text-sm"
                      />
                      <datalist id={`hosts-${teamName}`}>
                        {hosts.map((host) => (
                          <option key={host} value={host} />
                        ))}
                      </datalist>
                    </div>
                  </td>
                  <td className="table-cell text-center">
                    {config[teamName] && (
                      <button
                        onClick={() => handleRunScoring(config[teamName])}
                        disabled={running === config[teamName]}
                        className="btn-danger text-xs py-2 px-3 disabled:opacity-50"
                      >
                        {running === config[teamName] ? 'Running...' : 'Run'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <button onClick={handleSaveConfig} className="btn-primary w-full">
          Save Mapping Configuration
        </button>

        {unmappedTeams.length > 0 && (
          <div className="bg-cyber-red/20 border border-cyber-red text-cyber-red p-3 rounded text-sm">
            ⚠️ {unmappedTeams.length} team(s) not mapped: {unmappedTeams.join(', ')}
          </div>
        )}
      </div>

      {/* Available Hosts */}
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-cyber-accent">Available Hosts</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {hosts.length === 0 ? (
            <div className="col-span-full text-center text-cyber-muted py-8">
              No hosts found. Check ~/Downloads/scoring/hosts.txt
            </div>
          ) : (
            hosts.map((host) => (
              <button
                key={host}
                onClick={() => handleRunScoring(host)}
                disabled={running === host}
                className="btn-secondary text-sm py-2 px-3 disabled:opacity-50"
              >
                {running === host ? `Running...` : host}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Info */}
      <div className="space-y-3">
        <div className="bg-cyber-surface rounded border border-cyber-border p-4 text-sm text-cyber-muted">
          <p className="font-bold text-cyber-accent mb-2">How it works:</p>
          <ul className="space-y-1 list-disc list-inside">
            <li>Map each team to its corresponding host IP (type custom IPs as needed)</li>
            <li>Click "Run" to execute the scoring script for that host</li>
            <li>The script runs in the background and checks service availability</li>
            <li>Click "Sync All Results Now" to apply uptime scores to teams</li>
            <li>Click "Reset Scores" to clear uptime data and start fresh</li>
            <li>Enable "Auto-run Scoring" to periodically check all hosts</li>
          </ul>
        </div>

        <div className="bg-cyber-yellow/10 border border-cyber-yellow text-cyber-yellow p-4 rounded text-sm">
          <p className="font-bold mb-2">⚙️ Requirements:</p>
          <p className="mb-2">The scoring script requires these tools installed on your system:</p>
          <ul className="space-y-1 list-disc list-inside font-mono text-xs">
            <li>Python 3 with mysql-connector: <code>pip3 install mysql-connector-python</code></li>
            <li>sshpass: <code>apt install sshpass</code> (or brew on macOS)</li>
            <li>A running MySQL database with the scoring schema</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
