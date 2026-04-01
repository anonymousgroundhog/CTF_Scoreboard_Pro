export interface InjectScore {
  raw: number;
  sub_time?: string;
  late: number;
  final: number;
}

export interface TeamInjects {
  [injectName: string]: InjectScore;
}

export interface Team {
  school: string;
  uptime: number;
  red_team: number;
  defense: number;
  remarks?: string;
  injects: TeamInjects;
}

export interface InjectDefinition {
  desc: string;
  sol: string;
  time: string;
  release: string;
  due: string;
}

export interface AppState {
  teams: Record<string, Team>;
  inject_data: Record<string, InjectDefinition>;
  webhooks: Record<string, string>;
  broadcast_times: Record<string, string>;
}

export interface InjectScoreUpdate {
  raw?: number;
  sub_time?: string;
  late?: number;
  final?: number;
}

export interface InjectScoreBatch {
  [injectName: string]: InjectScoreUpdate;
}
