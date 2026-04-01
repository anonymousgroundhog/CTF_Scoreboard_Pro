import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppState, Team } from './types.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataFilePath = process.env.DATA_FILE || path.join(__dirname, '../../team_scores.json');

let state: AppState = {
  teams: {},
  inject_data: {},
  webhooks: {},
  broadcast_times: {},
};

// Normalize a team's inject entries to ensure sub_time is always present
function normalizeTeamInjects(team: Team, injectKeys: string[]) {
  for (const injectName of injectKeys) {
    if (!team.injects[injectName]) {
      team.injects[injectName] = { raw: 10.0, sub_time: '', late: 0, final: 10.0 };
    } else if (!('sub_time' in team.injects[injectName])) {
      team.injects[injectName].sub_time = '';
    }
  }
}

export async function loadState(): Promise<void> {
  try {
    const data = await fs.readFile(dataFilePath, 'utf-8');
    const parsed = JSON.parse(data) as AppState;

    // Normalize all team inject entries
    const injectKeys = Object.keys(parsed.inject_data || {});
    for (const teamName in parsed.teams) {
      normalizeTeamInjects(parsed.teams[teamName], injectKeys);
    }

    state = parsed;
    console.log(`✓ Loaded state from ${dataFilePath}`);
  } catch (err) {
    console.log(`→ Data file not found, using defaults`);
    // Initialize with empty state
    state = {
      teams: {},
      inject_data: {},
      webhooks: {},
      broadcast_times: {},
    };
  }
}

export function getState(): AppState {
  return state;
}

export function setState(newState: Partial<AppState>): void {
  state = { ...state, ...newState };
}

export async function persistState(): Promise<void> {
  try {
    const tmpPath = dataFilePath + '.tmp';
    await fs.writeFile(tmpPath, JSON.stringify(state, null, 4));
    await fs.rename(tmpPath, dataFilePath);
  } catch (err) {
    console.error('Failed to persist state:', err);
    throw err;
  }
}

// Convenience functions for common mutations
export function getTeam(name: string): Team | null {
  return state.teams[name] || null;
}

export function setTeam(name: string, team: Team): void {
  state.teams[name] = team;
}

export function deleteTeam(name: string): void {
  delete state.teams[name];
}

export function getInject(name: string): any | null {
  return state.inject_data[name] || null;
}

export function setInject(name: string, inject: any): void {
  state.inject_data[name] = inject;
}

export function deleteInject(name: string): void {
  delete state.inject_data[name];
}

export function getWebhook(channel: string): string | null {
  return state.webhooks[channel] || null;
}

export function setWebhooks(webhooks: Record<string, string>): void {
  state.webhooks = webhooks;
}

export function getBroadcastTime(injectName: string): string | null {
  return state.broadcast_times[injectName] || null;
}

export function setBroadcastTime(injectName: string, time: string): void {
  state.broadcast_times[injectName] = time;
}
