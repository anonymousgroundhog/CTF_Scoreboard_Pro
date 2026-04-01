import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function Scores() {
  const { teams, inject_data, updateTeam, loadState } = useStore();
  const [selectedTeam, setSelectedTeam] = useState<string | null>(
    Object.keys(teams)[0] || null
  );
  const [uptime, setUptime] = useState('');
  const [redTeam, setRedTeam] = useState('');
  const [remarks, setRemarks] = useState('');

  // Load form when team changes
  const handleTeamChange = (teamName: string) => {
    setSelectedTeam(teamName);
    const team = teams[teamName];
    if (team) {
      setUptime(String(team.uptime || 0));
      setRedTeam(String(team.red_team || 0));
      setRemarks(team.remarks || '');
    }
  };

  const handleSave = async () => {
    if (!selectedTeam) return;
    try {
      await updateTeam(selectedTeam, {
        uptime: parseFloat(uptime) || 0,
        red_team: parseFloat(redTeam) || 0,
        remarks,
      });
      loadState();
    } catch (err) {
      console.error(err);
    }
  };

  // Calculate scores for all teams
  const scoresData = Object.entries(teams).map(([name, team]) => {
    const injectsTotal = Object.values(team.injects).reduce((sum, inj) => sum + (inj.final || 0), 0);
    const uptimePercent = team.uptime / 50;
    const injectsPercent = injectsTotal / 50;
    const defense = team.red_team / 5;
    const total = 0.33 * uptimePercent + 0.33 * injectsPercent + 0.33 * defense;

    return {
      name,
      school: team.school,
      uptime: team.uptime,
      uptimePercent,
      injectsTotal,
      injectsPercent,
      redTeam: team.red_team,
      defense,
      total,
      remarks: team.remarks || '',
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cyber-accent">📊 Scores</h1>
        <p className="text-cyber-muted text-sm font-mono">
          Uptime % = Uptime ÷ 50 | Injects % = Total ÷ 50 | Defense = Red Team ÷ 5 | Total = 0.33 × each
        </p>
      </div>

      {scoresData.length === 0 ? (
        <div className="text-center py-12 text-cyber-muted">No teams to display</div>
      ) : (
        <div className="overflow-x-auto bg-cyber-surface rounded border border-cyber-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="table-header">
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2 text-left">School</th>
                <th className="px-3 py-2 text-right">Uptime</th>
                <th className="px-3 py-2 text-right">Uptime %</th>
                <th className="px-3 py-2 text-right">Injects</th>
                <th className="px-3 py-2 text-right">Injects %</th>
                <th className="px-3 py-2 text-right">Red Team</th>
                <th className="px-3 py-2 text-right">Defense</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-left">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {scoresData.map((row) => (
                <tr key={row.name} className="table-row">
                  <td className="table-cell font-bold">{row.name}</td>
                  <td className="table-cell text-cyber-muted text-xs">{row.school}</td>
                  <td className="table-cell text-right text-cyber-green">{row.uptime}</td>
                  <td className="table-cell text-right text-cyber-green">{row.uptimePercent.toFixed(4)}</td>
                  <td className="table-cell text-right text-cyber-green">{row.injectsTotal.toFixed(1)}</td>
                  <td className="table-cell text-right text-cyber-green">{row.injectsPercent.toFixed(4)}</td>
                  <td className="table-cell text-right text-cyber-green">{row.redTeam}</td>
                  <td className="table-cell text-right text-cyber-green">{row.defense.toFixed(4)}</td>
                  <td className="table-cell text-right text-cyber-accent font-bold">{row.total.toFixed(4)}</td>
                  <td className="table-cell text-xs truncate">{row.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Input form */}
      <div className="bg-cyber-surface rounded border border-cyber-border p-4">
        <h2 className="text-lg font-bold text-cyber-accent mb-4">Enter Uptime & Red Team Assessment</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <div>
            <label className="block text-xs font-bold text-cyber-muted mb-1">Team</label>
            <select
              value={selectedTeam || ''}
              onChange={(e) => handleTeamChange(e.target.value)}
              className="input-field w-full text-xs"
            >
              <option value="">Select team...</option>
              {Object.keys(teams).map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-cyber-muted mb-1">Uptime (raw)</label>
            <input
              type="number"
              value={uptime}
              onChange={(e) => setUptime(e.target.value)}
              className="input-field w-full text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-cyber-muted mb-1">Red Team (raw)</label>
            <input
              type="number"
              value={redTeam}
              onChange={(e) => setRedTeam(e.target.value)}
              className="input-field w-full text-xs"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="block text-xs font-bold text-cyber-muted mb-1">Remarks</label>
            <input
              type="text"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="input-field w-full text-xs"
            />
          </div>
          <div className="flex items-end">
            <button onClick={handleSave} className="btn-primary w-full text-xs">
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
