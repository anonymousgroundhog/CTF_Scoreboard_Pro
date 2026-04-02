import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function Leaderboard() {
  const { teams, inject_data } = useStore();
  const [highlightTop, setHighlightTop] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('leaderboard_highlightTop');
      return saved ? parseInt(saved) : 3;
    }
    return 3;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('leaderboard_highlightTop', String(highlightTop));
    }
  }, [highlightTop]);

  // Calculate leaderboard standings
  const standings = Object.entries(teams).map(([name, team]) => {
    const injectsTotal = Object.values(team.injects).reduce((sum, inj) => sum + (inj.final || 0), 0);
    const total = injectsTotal + team.uptime + team.red_team + (team.defense || 0);

    return {
      name,
      school: team.school,
      uptimePercent: team.uptime,
      injectsTotal,
      total,
    };
  });

  standings.sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cyber-accent">🏆 Leaderboard</h1>
        <div className="flex items-center gap-3 bg-cyber-surface rounded border border-cyber-border p-3">
          <label className="text-sm font-bold text-cyber-muted">Highlight Top</label>
          <input
            type="number"
            value={highlightTop}
            onChange={(e) => setHighlightTop(Math.max(0, parseInt(e.target.value) || 0))}
            min="0"
            max={standings.length || 10}
            className="input-field w-16 text-center text-sm"
          />
          <span className="text-sm text-cyber-muted">teams</span>
        </div>
      </div>

      {standings.length === 0 ? (
        <div className="text-center py-12 text-cyber-muted">No teams yet</div>
      ) : (
        <div className="overflow-x-auto bg-cyber-surface rounded border border-cyber-border">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3 text-left">Rank</th>
                <th className="px-4 py-3 text-left">Team</th>
                <th className="px-4 py-3 text-left">School</th>
                <th className="px-4 py-3 text-right">Uptime %</th>
                <th className="px-4 py-3 text-right">Injects</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row, idx) => {
                const isHighlighted = idx < highlightTop;
                const rankBadgeClass =
                  idx === 0 ? 'bg-cyber-yellow text-cyber-bg' :
                  idx === 1 ? 'bg-gray-400 text-cyber-bg' :
                  idx === 2 ? 'bg-orange-600 text-white' :
                  'bg-transparent text-cyber-muted';

                return (
                  <tr
                    key={row.name}
                    className={`table-row transition-colors ${
                      isHighlighted ? 'bg-cyber-yellow/10 border-l-4 border-l-cyber-yellow' : ''
                    }`}
                  >
                    <td className="table-cell">
                      <span className={`badge-rank ${rankBadgeClass} px-3 py-1 rounded text-sm font-bold`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className={`table-cell font-bold ${isHighlighted ? 'text-cyber-yellow' : ''}`}>
                      {row.name}
                    </td>
                    <td className="table-cell text-cyber-muted">{row.school}</td>
                    <td className={`table-cell text-right ${isHighlighted ? 'text-cyber-yellow font-bold' : 'text-cyber-green'}`}>
                      {row.uptimePercent}
                    </td>
                    <td className={`table-cell text-right ${isHighlighted ? 'text-cyber-yellow font-bold' : 'text-cyber-green'}`}>
                      {row.injectsTotal.toFixed(1)}
                    </td>
                    <td className={`table-cell text-right font-bold ${isHighlighted ? 'text-cyber-yellow' : 'text-cyber-accent'}`}>
                      {row.total.toFixed(1)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
