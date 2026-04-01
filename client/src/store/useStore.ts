import { create } from 'zustand';
import * as api from '../api/client';
import { AppState, Team, InjectDefinition, TabName, Toast } from '../types/index';

interface AppStore extends AppState {
  // UI state
  selectedTeam: string | null;
  selectedChannel: string | null;
  activeTab: TabName;
  toasts: Toast[];
  scoringConfig: Record<string, string>; // { teamName: host }
  autoRunInterval: number | null; // Milliseconds, or null if disabled

  // Actions
  loadState: () => Promise<void>;
  setSelectedTeam: (name: string | null) => void;
  setSelectedChannel: (channel: string | null) => void;
  setActiveTab: (tab: TabName) => void;

  // Team actions
  addTeam: (name: string, school: string) => Promise<void>;
  deleteTeam: (name: string) => Promise<void>;
  updateTeam: (name: string, data: Partial<Team>) => Promise<void>;
  saveInjectScores: (teamName: string, scores: Record<string, any>) => Promise<void>;

  // Inject actions
  deleteInject: (name: string) => Promise<void>;
  batchSaveInjects: (data: Record<string, InjectDefinition>) => Promise<void>;

  // Webhook actions
  updateWebhooks: (webhooks: Record<string, string>) => Promise<void>;
  deleteWebhook: (channel: string) => Promise<void>;

  // Broadcast
  broadcastInject: (injectName: string, channel: string) => Promise<string>;

  // Scoring actions
  loadScoringConfig: () => Promise<void>;
  saveScoringConfig: (config: Record<string, string>) => Promise<void>;
  getAvailableHosts: () => Promise<string[]>;
  runScoring: (host: string) => Promise<void>;
  syncScoringResults: () => Promise<void>;
  resetScoringResults: (teamNames?: string[]) => Promise<void>;
  setAutoRunInterval: (ms: number | null) => void;

  // Import/Export
  importJson: (file: File) => Promise<void>;
  importTeamsCsv: (file: File) => Promise<void>;
  importInjectsCsv: (file: File) => Promise<void>;

  // Toast
  pushToast: (message: string, type: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

export const useStore = create<AppStore>((set, get) => ({
  // Initial state
  teams: {},
  inject_data: {},
  webhooks: {},
  broadcast_times: {},
  selectedTeam: null,
  selectedChannel: null,
  activeTab: 'leaderboard',
  toasts: [],
  scoringConfig: {},
  autoRunInterval: null,

  // Load full state from server
  loadState: async () => {
    try {
      const state = await api.getState();
      set({
        teams: state.teams,
        inject_data: state.inject_data,
        webhooks: state.webhooks,
        broadcast_times: state.broadcast_times,
      });
      // Set default channel if webhooks exist
      const channels = Object.keys(state.webhooks);
      if (channels.length > 0 && !get().selectedChannel) {
        set({ selectedChannel: channels[0] });
      }
    } catch (err) {
      get().pushToast(`Failed to load state: ${err}`, 'error');
    }
  },

  setSelectedTeam: (name) => set({ selectedTeam: name }),
  setSelectedChannel: (channel) => set({ selectedChannel: channel }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Team actions
  addTeam: async (name, school) => {
    try {
      const newTeam = await api.createTeam(name, school);
      set((state) => ({
        teams: { ...state.teams, [name]: newTeam },
      }));
      get().pushToast(`Team "${name}" created`, 'success');
    } catch (err) {
      get().pushToast(`Failed to add team: ${err}`, 'error');
      throw err;
    }
  },

  deleteTeam: async (name) => {
    try {
      await api.deleteTeam(name);
      set((state) => {
        const { [name]: _, ...remaining } = state.teams;
        return { teams: remaining, selectedTeam: null };
      });
      get().pushToast(`Team "${name}" deleted`, 'success');
    } catch (err) {
      get().pushToast(`Failed to delete team: ${err}`, 'error');
      throw err;
    }
  },

  updateTeam: async (name, data) => {
    try {
      const updated = await api.updateTeam(name, data);
      set((state) => ({
        teams: { ...state.teams, [name]: updated },
      }));
      get().pushToast(`Team "${name}" updated`, 'success');
    } catch (err) {
      get().pushToast(`Failed to update team: ${err}`, 'error');
      throw err;
    }
  },

  saveInjectScores: async (teamName, scores) => {
    try {
      const updated = await api.saveInjectScores(teamName, scores);
      set((state) => ({
        teams: { ...state.teams, [teamName]: updated },
      }));
      get().pushToast(`Scores saved for "${teamName}"`, 'success');
    } catch (err) {
      get().pushToast(`Failed to save scores: ${err}`, 'error');
      throw err;
    }
  },

  // Inject actions
  deleteInject: async (name) => {
    try {
      await api.deleteInject(name);
      set((state) => {
        const { [name]: _, ...remaining } = state.inject_data;
        return { inject_data: remaining };
      });
      get().pushToast(`Inject "${name}" deleted`, 'success');
    } catch (err) {
      get().pushToast(`Failed to delete inject: ${err}`, 'error');
      throw err;
    }
  },

  batchSaveInjects: async (data) => {
    try {
      const updated = await api.batchSaveInjects(data);
      set({ inject_data: updated });
      get().pushToast('Inject configuration saved', 'success');
    } catch (err) {
      get().pushToast(`Failed to save injections: ${err}`, 'error');
      throw err;
    }
  },

  // Webhook actions
  updateWebhooks: async (webhooks) => {
    try {
      const updated = await api.updateWebhooks(webhooks);
      set({ webhooks: updated });
      get().pushToast('Webhooks updated', 'success');
    } catch (err) {
      get().pushToast(`Failed to update webhooks: ${err}`, 'error');
      throw err;
    }
  },

  deleteWebhook: async (channel) => {
    try {
      await api.deleteWebhook(channel);
      set((state) => {
        const { [channel]: _, ...remaining } = state.webhooks;
        return { webhooks: remaining };
      });
      get().pushToast(`Webhook for "${channel}" deleted`, 'success');
    } catch (err) {
      get().pushToast(`Failed to delete webhook: ${err}`, 'error');
      throw err;
    }
  },

  // Broadcast
  broadcastInject: async (injectName, channel) => {
    try {
      const res = await api.broadcastInject(injectName, channel);
      set((state) => ({
        broadcast_times: { ...state.broadcast_times, [injectName]: res.broadcast_time },
      }));
      get().pushToast(`Inject "${injectName}" broadcast to Discord`, 'success');
      return res.broadcast_time;
    } catch (err) {
      get().pushToast(`Failed to broadcast: ${err}`, 'error');
      throw err;
    }
  },

  // Scoring
  loadScoringConfig: async () => {
    try {
      const config = await api.getScoringConfig();
      set({ scoringConfig: config });
    } catch (err) {
      get().pushToast(`Failed to load scoring config: ${err}`, 'error');
    }
  },

  saveScoringConfig: async (config) => {
    try {
      const saved = await api.saveScoringConfig(config);
      set({ scoringConfig: saved });
      get().pushToast('Scoring configuration saved', 'success');
    } catch (err) {
      get().pushToast(`Failed to save scoring config: ${err}`, 'error');
      throw err;
    }
  },

  getAvailableHosts: async () => {
    try {
      const hosts = await api.getAvailableHosts();
      return hosts;
    } catch (err) {
      get().pushToast(`Failed to fetch hosts: ${err}`, 'error');
      throw err;
    }
  },

  runScoring: async (host) => {
    try {
      const res = await api.runScoring(host);
      get().pushToast(`${res.message}`, 'success');
    } catch (err) {
      get().pushToast(`Failed to run scoring: ${err}`, 'error');
      throw err;
    }
  },

  syncScoringResults: async () => {
    try {
      const res = await api.syncScoringResults();
      await get().loadState(); // Reload to get updated uptime
      get().pushToast(res.message, 'success');
    } catch (err) {
      get().pushToast(`Failed to sync scoring results: ${err}`, 'error');
      throw err;
    }
  },

  resetScoringResults: async (teamNames?: string[]) => {
    try {
      const res = await api.resetScoringResults(teamNames);
      await get().loadState(); // Reload to get reset uptime
      get().pushToast(res.message, 'success');
    } catch (err) {
      get().pushToast(`Failed to reset scores: ${err}`, 'error');
      throw err;
    }
  },

  setAutoRunInterval: (ms) => {
    set({ autoRunInterval: ms });
  },

  // Import/Export
  importJson: async (file) => {
    try {
      const state = await api.importJson(file);
      set({
        teams: state.teams,
        inject_data: state.inject_data,
        webhooks: state.webhooks,
        broadcast_times: state.broadcast_times,
      });
      get().pushToast('State imported from JSON', 'success');
    } catch (err) {
      get().pushToast(`Failed to import JSON: ${err}`, 'error');
      throw err;
    }
  },

  importTeamsCsv: async (file) => {
    try {
      const teams = await api.importTeamsCsv(file);
      set((state) => ({
        teams: { ...state.teams, ...teams },
      }));
      get().pushToast('Teams imported from CSV', 'success');
    } catch (err) {
      get().pushToast(`Failed to import teams CSV: ${err}`, 'error');
      throw err;
    }
  },

  importInjectsCsv: async (file) => {
    try {
      const injects = await api.importInjectsCsv(file);
      set({ inject_data: injects });
      get().pushToast('Injects imported from CSV', 'success');
    } catch (err) {
      get().pushToast(`Failed to import injects CSV: ${err}`, 'error');
      throw err;
    }
  },

  // Toast
  pushToast: (message, type) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }],
    }));
    setTimeout(() => {
      get().dismissToast(id);
    }, 3000);
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
