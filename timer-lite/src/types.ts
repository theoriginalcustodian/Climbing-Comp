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
  customAlert1Audio?: string;
  customAlert1AudioName?: string;
  customAlert2Audio?: string;
  customAlert2AudioName?: string;
  customAlert3Audio?: string;
  customAlert3AudioName?: string;
  countdownTickAudio?: string;
  countdownTickAudioName?: string;
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
  customAlert1Time: number;
  customAlert2Time: number;
  customAlert3Time: number;
  enableCustomAlert1: boolean;
  enableCustomAlert2: boolean;
  enableCustomAlert3: boolean;
  enableCountdownTick: boolean;
}

export interface TimerState {
  running: boolean;
  phase: TimerPhase;
  remaining: number;
  elapsed: number;
}
