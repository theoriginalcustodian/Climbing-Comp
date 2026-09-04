export type TimerPhase = 'idle' | 'prep' | 'climb' | 'pause';

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
  preEndWarningAudio?: string;
  preEndWarningAudioName?: string;
}

export interface CompetitionLogoConfig {
  type: 'cijel' | 'pachamama' | 'custom' | 'none';
  customUrl?: string;
  featherEdges: boolean;
  featherIntensity: 'soft' | 'medium' | 'strong';
  maxHeightPx?: number;
  headerMaxHeightPx?: number;
}

export interface TimerConfig {
  prepTime: number;
  climbTime: number;
  pauseTime: number;
  preEndWarning: number;
  preStartWarning: number;
  audio?: TimerAudioConfig;
  loop: boolean;
  enablePause: boolean;
  enablePrep: boolean;
  enablePreStart: boolean;
  enablePreEnd: boolean;
}

export interface TimerState {
  running: boolean;
  phase: TimerPhase;
  remaining: number;
  elapsed: number;
}
