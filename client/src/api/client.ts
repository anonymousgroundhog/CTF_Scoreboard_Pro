import { AppState, Team, InjectDefinition, TabName } from '../types/index';

// Get API base from localStorage or use default
export function getAPIBase(): string {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('apiBase');
    if (stored) return stored;
  }
  return '/api';
}

export function setAPIBase(base: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('apiBase', base);
  }
}

export function getFullAPIBase(): string {
  const base = getAPIBase();
  if (base.startsWith('http')) {
    return base;
  }
  // Relative path
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}${base}`;
  }
  return base;
}

const API_BASE = getAPIBase();

async function fetchApi<T>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    // Token expired or invalid
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth_token');
      window.location.href = '/';
    }
    throw new Error('Authentication expired. Please login again.');
  }

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

// Auth API
export const login = (password: string) =>
  fetchApi<{ token: string; message: string }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ password }),
  });

export const verifyToken = (token: string) =>
  fetch(`${API_BASE}/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  }).then((res) => res.json() as Promise<{ valid: boolean }>);

// State
export const getState = () => fetchApi<AppState>('/state');

// Teams
export const getTeams = () => fetchApi<Record<string, Team>>('/teams');
export const createTeam = (name: string, school: string) =>
  fetchApi<Team>('/teams', {
    method: 'POST',
    body: JSON.stringify({ name, school }),
  });
export const updateTeam = (name: string, data: Partial<Team>) =>
  fetchApi<Team>(`/teams/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteTeam = (name: string) =>
  fetchApi<{ success: boolean }>(`/teams/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });

// Inject scores
export const saveInjectScores = (teamName: string, scores: Record<string, any>) =>
  fetchApi<Team>(`/teams/${encodeURIComponent(teamName)}/injects`, {
    method: 'PUT',
    body: JSON.stringify(scores),
  });

// Injects
export const getInjects = () => fetchApi<Record<string, InjectDefinition>>('/injects');
export const createInject = (name: string, desc: string, sol: string, time: string, release: string, due: string) =>
  fetchApi<InjectDefinition>('/injects', {
    method: 'POST',
    body: JSON.stringify({ name, desc, sol, time, release, due }),
  });
export const updateInject = (name: string, data: Partial<InjectDefinition>) =>
  fetchApi<InjectDefinition>(`/injects/${encodeURIComponent(name)}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
export const deleteInject = (name: string) =>
  fetchApi<{ success: boolean }>(`/injects/${encodeURIComponent(name)}`, {
    method: 'DELETE',
  });
export const batchSaveInjects = (data: Record<string, InjectDefinition>) =>
  fetchApi<Record<string, InjectDefinition>>('/injects/batch', {
    method: 'POST',
    body: JSON.stringify(data),
  });

// Webhooks
export const getWebhooks = () => fetchApi<Record<string, string>>('/webhooks');
export const updateWebhooks = (webhooks: Record<string, string>) =>
  fetchApi<Record<string, string>>('/webhooks', {
    method: 'PUT',
    body: JSON.stringify(webhooks),
  });
export const deleteWebhook = (channel: string) =>
  fetchApi<{ success: boolean }>(`/webhooks/${encodeURIComponent(channel)}`, {
    method: 'DELETE',
  });

// Broadcast
export const broadcastInject = (injectName: string, channel: string) =>
  fetchApi<{ broadcast_time: string }>(`/broadcast/${encodeURIComponent(injectName)}`, {
    method: 'POST',
    body: JSON.stringify({ channel }),
  });
export const getBroadcastTimes = () => fetchApi<Record<string, string>>('/broadcast/times');

// Scoring
export const getScoringConfig = () =>
  fetchApi<Record<string, string>>('/scoring/config');

export const saveScoringConfig = (config: Record<string, string>) =>
  fetchApi<Record<string, string>>('/scoring/config', {
    method: 'PUT',
    body: JSON.stringify(config),
  });

export const getAvailableHosts = () =>
  fetchApi<string[]>('/scoring/hosts');

export const runScoring = (host: string) =>
  fetchApi<{ success: boolean; host: string; output: string; message: string }>('/scoring/run', {
    method: 'POST',
    body: JSON.stringify({ host }),
  });

export const syncScoringResults = () =>
  fetchApi<{ success: boolean; results: Record<string, number> }>('/scoring/sync', {
    method: 'POST',
  });

export const resetScoringResults = (teamNames?: string[]) =>
  fetchApi<{ success: boolean; resetResults: Record<string, number>; message: string }>('/scoring/reset', {
    method: 'POST',
    body: JSON.stringify({ teamNames: teamNames || [] }),
  });

// Import/Export
export const exportState = async () => {
  window.location.href = '/api/export';
};

export const importJson = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/import/json`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json() as Promise<AppState>;
};

export const importTeamsCsv = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/import/teams-csv`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json() as Promise<Record<string, Team>>;
};

export const importInjectsCsv = async (file: File) => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/import/injects-csv`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  return res.json() as Promise<Record<string, InjectDefinition>>;
};
