export type TimerPhase = 'focus' | 'shortBreak' | 'longBreak'
export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished'

export interface TimerConfig {
  focusDuration: number       // minutes
  shortBreakDuration: number  // minutes
  longBreakDuration: number   // minutes
  longBreakInterval: number   // sessions before long break
  autoStartBreak: boolean
  autoStartFocus: boolean
}

export interface TimerState {
  status: TimerStatus
  phase: TimerPhase
  elapsedSeconds: number
  totalSessions: number
  sessionCount: number        // focus sessions in current cycle
  sessionStartTime: number | null // Date.now() timestamp
  pausedAtElapsed: number     // accumulated elapsed when paused
}
