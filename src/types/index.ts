export type { TimerPhase, TimerStatus, TimerConfig, TimerState } from './timer'
export type { Subject, SubjectSprites } from './subject'
export type { AudioTrack, AudioCategory } from './audio'
export type { StudyLog, DailyStats } from './log'
export type { AppSettings, AIProvider } from './settings'

// Achievement
export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  unlockedAt: number | null
  progress: number           // 0-100
}

// Affection
export interface AffectionScore {
  id?: number
  subjectId: number
  totalMinutes: number
  level: number              // 1-10
}

// Companion message
export interface CompanionMessage {
  text: string
  context: 'timerStart' | 'timerEnd' | 'encourage' | 'idle'
}
