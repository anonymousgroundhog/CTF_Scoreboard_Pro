import { useState, useEffect } from 'react';
import { getAPIBase, setAPIBase, getFullAPIBase } from '../../api/client';
import { useStore } from '../../store/useStore';

interface Props {
  onClose: () => void;
}

export default function ServerSettings({ onClose }: Props) {
  const [apiBase, setApiBaseLocal] = useState(getAPIBase());
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const { loadState } = useStore();

  useEffect(() => {
    setApiBaseLocal(getAPIBase());
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      setAPIBase(apiBase);
      // Test the connection
      const fullBase = apiBase.startsWith('http')
        ? apiBase
        : `${window.location.protocol}//${window.location.host}${apiBase}`;

      const res = await fetch(`${fullBase}/state`);
      if (res.ok) {
        setTestResult('✓ Connection successful!');
        // Reload state with new server
        setTimeout(() => {
          loadState();
          setTimeout(() => onClose(), 1500);
        }, 500);
      } else {
        setTestResult('✗ Connection failed (HTTP ' + res.status + ')');
      }
    } catch (err) {
      setTestResult(`✗ Error: ${err}`);
    }
    setIsSaving(false);
  };

  const handleTest = async () => {
    setIsSaving(true);
    try {
      const fullBase = apiBase.startsWith('http')
        ? apiBase
        : `${window.location.protocol}//${window.location.host}${apiBase}`;

      const res = await fetch(`${fullBase}/state`, { method: 'GET' });
      if (res.ok) {
        setTestResult('✓ Server connection successful!');
      } else {
        setTestResult(`✗ Server returned HTTP ${res.status}`);
      }
    } catch (err) {
      setTestResult(`✗ Cannot reach server: ${err}`);
    }
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-cyber-surface border border-cyber-border rounded p-6 w-96 space-y-4">
        <h2 className="text-lg font-bold text-cyber-accent">Server Settings</h2>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-cyber-muted">API Server Address</label>
          <input
            type="text"
            value={apiBase}
            onChange={(e) => {
              setApiBaseLocal(e.target.value);
              setTestResult(null);
            }}
            placeholder="/api or http://localhost:3001/api"
            className="input-field w-full text-sm"
          />
          <p className="text-xs text-cyber-muted">
            Use <code className="bg-cyber-bg px-1 rounded">/api</code> for relative path (default) or full URL like{' '}
            <code className="bg-cyber-bg px-1 rounded">http://example.com:3001/api</code>
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-bold text-cyber-muted">Current Connection</label>
          <div className="bg-cyber-bg p-3 rounded border border-cyber-border text-xs font-mono break-all">
            {getFullAPIBase()}
          </div>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded border text-sm font-mono ${
              testResult.startsWith('✓')
                ? 'bg-cyber-green/10 border-cyber-green text-cyber-green'
                : 'bg-cyber-red/10 border-cyber-red text-cyber-red'
            }`}
          >
            {testResult}
          </div>
        )}

        <div className="flex gap-2 pt-4 border-t border-cyber-border">
          <button onClick={onClose} className="btn-secondary flex-1 text-sm py-2">
            Cancel
          </button>
          <button
            onClick={handleTest}
            disabled={isSaving}
            className="btn-secondary flex-1 text-sm py-2 disabled:opacity-50"
          >
            Test
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="btn-primary flex-1 text-sm py-2 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save & Connect'}
          </button>
        </div>
      </div>
    </div>
  );
}
