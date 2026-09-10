export interface Location {
  id: string;
  name: string;
  description: string;
}

export interface Inhabitant {
  id: string;
  name: string;
  description: string;
  status?: string; // short current-state note, e.g. "restless, wandering the shore"
}

export interface HistoryEntry {
  id: string;
  timestamp: string; // ISO real-world timestamp when this change happened
  worldTimestamp: string; // ISO in-world timestamp
  summary: string; // what changed
}

export interface InfluenceEntry {
  id: string;
  timestamp: string;
  note?: string;
  imagePath?: string;
  consumed: boolean; // whether it has already shaped an evolution
}

export interface WorldState {
  id: string;
  name: string;
  seedPrompt: string;
  seedImagePaths: string[];
  createdAt: string; // ISO real-world
  worldStartedAt: string; // ISO in-world epoch
  lastEvolvedAt: string; // ISO real-world timestamp of last evolution
  worldTime: string; // ISO in-world "current" time
  summary: string;
  atmosphere: string; // mood / weather in a sentence or two
  locations: Location[];
  inhabitants: Inhabitant[];
  recentEvents: string[]; // short bullet list, most recent first
  history: HistoryEntry[];
  influences: InfluenceEntry[];
}

export interface EvolveResult {
  world: WorldState;
  changeSummary: string;
}
