export type TimerPhase = 'idle' | 'prep' | 'climb' | 'pause' | 'stopped';

export type TimerMode = 'auto' | 'semi' | 'manual';

export interface Competitor {
  id: string;
  dorsal: string;
  name: string;
  category: string;
  club?: string;
  status: 'registered' | 'waiting' | 'climbing' | 'completed';
  startOrder: number;
}

export interface Problem {
  id: string;
  number: number;
  name: string;
  grade?: string;
  holdColor: string;
  hasZone: boolean;
  setter?: string;
  sector?: string;
  points?: number;
  description?: string;
}

export interface AttemptRecord {
  competitorId: string;
  problemId: string;
  attempts: number;
  gotTop: boolean;
  topAttempt?: number;
  gotZone: boolean;
  zoneAttempt?: number;
}

export interface TimerAudioConfig {
  climbStartAudio?: string;
  climbStartAudioName?: string;
  climbEndAudio?: string;
  climbEndAudioName?: string;
  pauseStartAudio?: string;
  pauseStartAudioName?: string;
  pauseEndAudio?: string;
  pauseEndAudioName?: string;
  prepStartAudio?: string;
  prepStartAudioName?: string;
  prepEndAudio?: string;
  prepEndAudioName?: string;
}

export interface TimerConfig {
  prepTime: number; // seconds
  climbTime: number; // seconds
  pauseTime: number; // seconds
  preEndWarning: number; // seconds
  preStartWarning: number; // seconds
  mode: TimerMode;
  soundEnabled: boolean;
  volume: number;
  audio?: TimerAudioConfig;
}

export interface ScoringConfig {
  system: 'ifsc' | 'points';
  pointsPerTop: number;
  pointsPerZone: number;
  penaltyPerTopAttempt: number;
  penaltyPerZoneAttempt: number;
  maxAttempts: number;
  tieBreaker: 'tops_zones_attempts' | 'points_then_attempts' | 'attempts_first';
}
