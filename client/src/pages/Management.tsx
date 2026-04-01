import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';

export default function Management() {
  const {
    inject_data,
    webhooks,
    batchSaveInjects,
    deleteInject,
    updateWebhooks,
    importJson,
    importTeamsCsv,
    importInjectsCsv,
    exportState,
  } = useStore();

  const [injectRows, setInjectRows] = useState(
    Object.entries(inject_data).map(([name, info]) => ({
      name,
      desc: info.desc,
      sol: info.sol,
      time: info.time,
      release: info.release,
      due: info.due,
    }))
  );

  const [webhookRows, setWebhookRows] = useState(webhooks);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const teamsCsvInputRef = useRef<HTMLInputElement>(null);
  const injectsCsvInputRef = useRef<HTMLInputElement>(null);

  const handleInjectRowChange = (idx: number, field: string, value: string) => {
    const updated = [...injectRows];
    (updated[idx] as any)[field] = value;
    setInjectRows(updated);
  };

  const handleAddInjectRow = () => {
    setInjectRows([
      ...injectRows,
      { name: '', desc: '', sol: '', time: '30', release: '', due: '' },
    ]);
  };

  const handleDeleteInjectRow = async (idx: number) => {
    const row = injectRows[idx];
    if (row.name && inject_data[row.name]) {
      try {
        await deleteInject(row.name);
      } catch (err) {
        console.error(err);
      }
    }
    setInjectRows(injectRows.filter((_, i) => i !== idx));
  };

  const handleSaveGrid = async () => {
    const newData: Record<string, any> = {};
    for (const row of injectRows) {
      if (row.name.trim()) {
        newData[row.name] = {
          desc: row.desc,
          sol: row.sol,
          time: row.time,
          release: row.release,
          due: row.due,
        };
      }
    }
    try {
      await batchSaveInjects(newData);
    } catch (err) {
      console.error(err);
    }
  };

  const handleWebhookChange = (channel: string, url: string) => {
    setWebhookRows({ ...webhookRows, [channel]: url });
  };

  const handleSaveWebhooks = async () => {
    try {
      await updateWebhooks(webhookRows);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileSelect = async (
    inputRef: React.RefObject<HTMLInputElement>,
    handler: (file: File) => Promise<void>
  ) => {
    const file = inputRef.current?.files?.[0];
    if (file) {
      try {
        await handler(file);
        if (inputRef.current) inputRef.current.value = '';
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-cyber-accent">⚙️ Management</h1>

      {/* Toolbar */}
      <div className="bg-cyber-surface rounded border border-cyber-border p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <button
            onClick={() => jsonInputRef.current?.click()}
            className="btn-secondary text-sm py-2"
          >
            Import JSON
          </button>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json"
            onChange={() => handleFileSelect(jsonInputRef, importJson)}
            className="hidden"
          />

          <button
            onClick={() => teamsCsvInputRef.current?.click()}
            className="btn-secondary text-sm py-2"
          >
            Import Teams CSV
          </button>
          <input
            ref={teamsCsvInputRef}
            type="file"
            accept=".csv"
            onChange={() => handleFileSelect(teamsCsvInputRef, importTeamsCsv)}
            className="hidden"
          />

          <button
            onClick={() => injectsCsvInputRef.current?.click()}
            className="btn-secondary text-sm py-2"
          >
            Import Injects CSV
          </button>
          <input
            ref={injectsCsvInputRef}
            type="file"
            accept=".csv"
            onChange={() => handleFileSelect(injectsCsvInputRef, importInjectsCsv)}
            className="hidden"
          />

          <button onClick={handleAddInjectRow} className="btn-secondary text-sm py-2">
            Add Inject Row
          </button>

          <button onClick={exportState} className="btn-secondary text-sm py-2">
            Export JSON
          </button>

          <button onClick={handleSaveGrid} className="btn-primary text-sm py-2 col-span-2 sm:col-span-1 lg:col-span-1">
            SAVE GRID
          </button>
        </div>
      </div>

      {/* Inject config grid */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-cyber-accent">Inject Configuration</h2>
        <div className="bg-cyber-surface rounded border border-cyber-border overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="table-header">
                <th className="px-3 py-2 text-left min-w-[120px]">Name</th>
                <th className="px-3 py-2 text-left min-w-[200px]">Description</th>
                <th className="px-3 py-2 text-left min-w-[200px]">Solution</th>
                <th className="px-3 py-2 text-right min-w-[80px]">Duration (m)</th>
                <th className="px-3 py-2 text-right min-w-[90px]">Rel Time</th>
                <th className="px-3 py-2 text-right min-w-[90px]">Due Time</th>
                <th className="px-3 py-2 text-center min-w-[70px]">Action</th>
              </tr>
            </thead>
            <tbody>
              {injectRows.map((row, idx) => (
                <tr key={idx} className="table-row">
                  <td className="table-cell">
                    <input
                      type="text"
                      value={row.name}
                      onChange={(e) => handleInjectRowChange(idx, 'name', e.target.value)}
                      className="input-field w-full text-xs"
                      placeholder="Inject name"
                    />
                  </td>
                  <td className="table-cell">
                    <textarea
                      value={row.desc}
                      onChange={(e) => handleInjectRowChange(idx, 'desc', e.target.value)}
                      className="input-field w-full text-xs font-mono h-16"
                      placeholder="Description"
                    />
                  </td>
                  <td className="table-cell">
                    <textarea
                      value={row.sol}
                      onChange={(e) => handleInjectRowChange(idx, 'sol', e.target.value)}
                      className="input-field w-full text-xs font-mono h-16"
                      placeholder="Solution key"
                    />
                  </td>
                  <td className="table-cell">
                    <input
                      type="text"
                      value={row.time}
                      onChange={(e) => handleInjectRowChange(idx, 'time', e.target.value)}
                      className="input-field w-full text-xs"
                      placeholder="30"
                    />
                  </td>
                  <td className="table-cell">
                    <input
                      type="text"
                      value={row.release}
                      onChange={(e) => handleInjectRowChange(idx, 'release', e.target.value)}
                      className="input-field w-full text-xs"
                      placeholder="HH:MM"
                    />
                  </td>
                  <td className="table-cell">
                    <input
                      type="text"
                      value={row.due}
                      onChange={(e) => handleInjectRowChange(idx, 'due', e.target.value)}
                      className="input-field w-full text-xs"
                      placeholder="HH:MM"
                    />
                  </td>
                  <td className="table-cell text-center">
                    <button
                      onClick={() => handleDeleteInjectRow(idx)}
                      className="btn-danger text-xs py-1 px-2"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook config */}
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-cyber-accent">Discord Webhooks</h2>
        <div className="bg-cyber-surface rounded border border-cyber-border p-4 space-y-3">
          {Object.entries(webhookRows).map(([channel, url]) => (
            <div key={channel} className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs font-bold text-cyber-muted">Channel</label>
                <input type="text" value={channel} disabled className="input-field w-full text-xs" />
              </div>
              <div className="flex-1">
                <label className="text-xs font-bold text-cyber-muted">Webhook URL</label>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => handleWebhookChange(channel, e.target.value)}
                  className="input-field w-full text-xs"
                />
              </div>
              <button
                onClick={() => {
                  const updated = { ...webhookRows };
                  delete updated[channel];
                  setWebhookRows(updated);
                }}
                className="btn-danger text-xs py-2 px-3"
              >
                Remove
              </button>
            </div>
          ))}
          <button onClick={handleSaveWebhooks} className="btn-primary w-full text-sm">
            Save Webhooks
          </button>
        </div>
      </div>
    </div>
  );
}
