import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import Tooltip from '../components/ui/Tooltip';

export default function DataEntry() {
  const { teams, inject_data, webhooks, broadcast_times, selectedTeam, setSelectedTeam, saveInjectScores, broadcastInject } = useStore();
  const [selectedChannel, setSelectedChannel] = useState<string>(Object.keys(webhooks)[0] || '');

  // Form state - local to this page
  const [formScores, setFormScores] = useState<Record<string, any>>({});

  // Load team data when selected team changes
  useEffect(() => {
    if (selectedTeam && teams[selectedTeam]) {
      const team = teams[selectedTeam];
      const scores: Record<string, any> = {};
      for (const injectName of Object.keys(inject_data)) {
        const existing = team.injects[injectName] || {};
        scores[injectName] = {
          raw: existing.raw || 10,
          subTime: existing.sub_time || '',
          late: existing.late || 0,
          final: existing.final || 10,
        };
      }
      setFormScores(scores);
    }
  }, [selectedTeam, teams, inject_data]);

  const handleRawChange = (injectName: string, value: string) => {
    const raw = parseFloat(value) || 0;
    updateScore(injectName, { raw }, inject_data[injectName]?.time);
  };

  const handleSubTimeChange = (injectName: string, value: string) => {
    updateScore(injectName, { subTime: value }, inject_data[injectName]?.time);
  };

  const handleLateChange = (injectName: string, value: string) => {
    const late = parseInt(value) || 0;
    updateScore(injectName, { late, userEditedLate: true });
  };

  const updateScore = (injectName: string, updates: any, duration?: string) => {
    setFormScores((prev) => {
      const current = prev[injectName] || { raw: 0, subTime: '', late: 0, final: 0, userEditedLate: false };
      const updated = { ...current, ...updates };

      // Auto-calc lateness if broadcast time exists and user hasn't manually set it
      if (!updated.userEditedLate && broadcast_times[injectName] && updated.subTime) {
        const durationMins = parseInt(duration || '30');
        try {
          const broadcastTime = new Date(`2000-01-01 ${broadcast_times[injectName]}`);
          const subTime = new Date(`2000-01-01 ${updated.subTime}`);
          const diffMins = (subTime.getTime() - broadcastTime.getTime()) / (1000 * 60);
          const autoLate = Math.max(0, Math.floor(diffMins - durationMins));
          updated.late = autoLate;
        } catch (e) {
          // Invalid time format
        }
      }

      // Calculate final score
      updated.final = Math.max(0, updated.raw - updated.late);

      return { ...prev, [injectName]: updated };
    });
  };

  const handleSaveScores = async () => {
    if (!selectedTeam) return;

    const toSave: Record<string, any> = {};
    for (const injectName of Object.keys(inject_data)) {
      const score = formScores[injectName] || { raw: 0, subTime: '', late: 0, final: 0 };
      toSave[injectName] = {
        raw: parseFloat(String(score.raw)) || 0,
        sub_time: score.subTime || '',
        late: score.late || 0,
        final: score.final || 0,
      };
    }

    try {
      await saveInjectScores(selectedTeam, toSave);
    } catch (err) {
      console.error(err);
    }
  };

  const handleBroadcast = async (injectName: string) => {
    if (!selectedChannel) {
      alert('Select a Discord channel first');
      return;
    }
    try {
      await broadcastInject(injectName, selectedChannel);
    } catch (err) {
      console.error(err);
    }
  };

  const teamList = Object.keys(teams).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-3xl font-bold text-cyber-accent">📝 Data Entry</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm font-bold text-cyber-muted">Discord Channel:</label>
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="input-field text-sm w-48"
          >
            <option value="">Select channel...</option>
            {Object.keys(webhooks).map((ch) => (
              <option key={ch} value={ch}>
                {ch}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 h-[calc(100vh-200px)]">
        {/* Team list */}
        <div className="bg-cyber-surface rounded border border-cyber-border overflow-hidden flex flex-col">
          <div className="p-3 border-b border-cyber-border font-bold text-cyber-accent">Teams</div>
          <div className="overflow-y-auto flex-1">
            {teamList.map((name) => (
              <button
                key={name}
                onClick={() => setSelectedTeam(name)}
                className={`w-full text-left px-4 py-2 border-b border-cyber-border text-sm font-mono transition-colors ${
                  selectedTeam === name ? 'bg-cyber-accent text-cyber-bg' : 'hover:bg-cyber-border'
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>

        {/* Inject grid */}
        <div className="col-span-3 bg-cyber-surface rounded border border-cyber-border flex flex-col overflow-hidden">
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs">
              <thead className="sticky top-0 z-10">
                <tr className="table-header">
                  <th className="px-3 py-2 text-left min-w-[150px]">Inject Name</th>
                  <th className="px-3 py-2 text-right min-w-[80px]">Raw (0-10)</th>
                  <th className="px-3 py-2 text-right min-w-[90px]">Sub Time</th>
                  <th className="px-3 py-2 text-right min-w-[80px]">Mins Late</th>
                  <th className="px-3 py-2 text-right min-w-[80px]">Final</th>
                  <th className="px-3 py-2 text-center min-w-[90px]">Broadcast</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(inject_data).map((injectName) => {
                  const score = formScores[injectName] || { raw: 0, subTime: '', late: 0, final: 0 };
                  const inject = inject_data[injectName];
                  const broadcastTime = broadcast_times[injectName];

                  return (
                    <tr key={injectName} className="table-row">
                      <td className="table-cell">
                        <Tooltip text={`DESC: ${inject.desc}\n\nKEY: ${inject.sol}`}>
                          <span className="text-cyber-accent hover:underline cursor-help">{injectName}</span>
                        </Tooltip>
                      </td>
                      <td className="table-cell">
                        <input
                          type="number"
                          value={score.raw}
                          onChange={(e) => handleRawChange(injectName, e.target.value)}
                          className="input-field w-full text-xs"
                          step="0.5"
                          min="0"
                          max="10"
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="text"
                          value={score.subTime}
                          onChange={(e) => handleSubTimeChange(injectName, e.target.value)}
                          placeholder="HH:MM"
                          className="input-field w-full text-xs"
                        />
                      </td>
                      <td className="table-cell">
                        <input
                          type="number"
                          value={score.late}
                          onChange={(e) => handleLateChange(injectName, e.target.value)}
                          className="input-field w-full text-xs"
                          min="0"
                        />
                      </td>
                      <td className="table-cell text-right text-cyber-green font-bold">{score.final.toFixed(1)}</td>
                      <td className="table-cell text-center">
                        <button
                          onClick={() => handleBroadcast(injectName)}
                          className="btn-danger text-xs py-1 px-2"
                        >
                          📢
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="border-t border-cyber-border p-3">
            <button onClick={handleSaveScores} className="btn-primary w-full">
              SAVE SCORES
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
