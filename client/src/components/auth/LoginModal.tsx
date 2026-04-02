import { useState } from 'react';
import { login } from '../../api/client';
import { useStore } from '../../store/useStore';

interface Props {
  onLogin: (token: string) => void;
}

export default function LoginModal({ onLogin }: Props) {
  const { setActiveTab } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await login(password);
      localStorage.setItem('auth_token', res.token);
      onLogin(res.token);
    } catch (err) {
      setError(`Login failed: ${err}`);
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-cyber-surface border-2 border-cyber-accent rounded p-8 w-96 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-cyber-accent">🏆 Admin Access</h1>
          <p className="text-cyber-muted text-sm mt-2">Authentication Required for Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-cyber-muted mb-2">Admin Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              placeholder="Enter admin password"
              className="input-field w-full text-center text-lg tracking-widest"
              disabled={isLoading}
              autoFocus
            />
          </div>

          {error && (
            <div className="bg-cyber-red/20 border border-cyber-red text-cyber-red p-3 rounded text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="btn-primary w-full py-3 font-bold disabled:opacity-50"
          >
            {isLoading ? 'Authenticating...' : 'Login'}
          </button>
        </form>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className="btn-secondary w-full py-2 text-sm"
        >
          ← Back to Leaderboard
        </button>

        <div className="border-t border-cyber-border pt-4 text-center text-xs text-cyber-muted space-y-2">
          <p>🏆 <strong>Public Leaderboard:</strong> Open to all competitors</p>
          <p>🔐 <strong>Admin Panel:</strong> Password-protected management tools</p>
        </div>
      </div>
    </div>
  );
}
