import { create } from 'zustand'
import type { TimerStatus, TimerPhase, TimerConfig } from '../types'
import { DEFAULT_FOCUS_MINUTES, DEFAULT_BREAK_MINUTES, DEFAULT_LONG_BREAK_MINUTES, LONG_BREAK_INTERVAL } from '../utils/constants'

interface TimerStore {
  // State
  status: TimerStatus
  phase: TimerPhase
  currentSubjectId: number | null
  elapsedSeconds: number
  totalSessions: number
  sessionCount: number
  sessionStartTime: number | null
  pausedAtElapsed: number

  // Config
  config: TimerConfig

  // Actions
  setSubject: (subjectId: number | null) => void
  start: () => void
  pause: () => void
  resume: () => void
  reset: () => void
  finish: () => void
  tick: () => number  // returns remaining seconds
  updateConfig: (partial: Partial<TimerConfig>) => void

  // Getters (implemented as functions for non-reactive reads)
  getCurrentDuration: () => number
  getRemainingSeconds: () => number
  getProgress: () => number
}

export const useTimerStore = create<TimerStore>((set, get) => ({
  status: 'idle',
  phase: 'focus',
  currentSubjectId: null,
  elapsedSeconds: 0,
  totalSessions: 0,
  sessionCount: 0,
  sessionStartTime: null,
  pausedAtElapsed: 0,

  config: {
    focusDuration: DEFAULT_FOCUS_MINUTES,
    shortBreakDuration: DEFAULT_BREAK_MINUTES,
    longBreakDuration: DEFAULT_LONG_BREAK_MINUTES,
    longBreakInterval: LONG_BREAK_INTERVAL,
    autoStartBreak: false,
    autoStartFocus: false,
  },

  setSubject: (subjectId) => set({ currentSubjectId: subjectId }),

  start: () => {
    const { config, phase } = get()
    const durationMinutes = phase === 'focus'
      ? config.focusDuration
      : phase === 'shortBreak'
        ? config.shortBreakDuration
        : config.longBreakDuration

    set({
      status: 'running',
      sessionStartTime: Date.now(),
      elapsedSeconds: 0,
      pausedAtElapsed: 0,
    })
  },

  pause: () => {
    const { elapsedSeconds } = get()
    set({
      status: 'paused',
      pausedAtElapsed: elapsedSeconds,
      sessionStartTime: null,
    })
  },

  resume: () => {
    set({
      status: 'running',
      sessionStartTime: Date.now(),
    })
  },

  reset: () => {
    set({
      status: 'idle',
      elapsedSeconds: 0,
      pausedAtElapsed: 0,
      sessionStartTime: null,
    })
  },

  finish: () => {
    const { phase } = get()
    set((state) => ({
      status: 'finished',
      elapsedSeconds: state.phase === 'focus'
        ? state.config.focusDuration * 60
        : state.config.shortBreakDuration * 60,
      totalSessions: phase === 'focus'
        ? state.totalSessions + 1
        : state.totalSessions,
      sessionCount: phase === 'focus'
        ? state.sessionCount + 1
        : state.sessionCount,
      sessionStartTime: null,
    }))
  },

  tick: () => {
    const { status, sessionStartTime, pausedAtElapsed } = get()
    if (status !== 'running' || !sessionStartTime) return get().getRemainingSeconds()

    const now = Date.now()
    const elapsed = pausedAtElapsed + Math.floor((now - sessionStartTime) / 1000)
    set({ elapsedSeconds: elapsed })

    const remaining = get().getRemainingSeconds()
    if (remaining <= 0) {
      get().finish()
    }
    return Math.max(0, remaining)
  },

  updateConfig: (partial) => {
    set((state) => ({
      config: { ...state.config, ...partial },
    }))
  },

  getCurrentDuration: () => {
    const { config, phase } = get()
    switch (phase) {
      case 'focus': return config.focusDuration * 60
      case 'shortBreak': return config.shortBreakDuration * 60
      case 'longBreak': return config.longBreakDuration * 60
    }
  },

  getRemainingSeconds: () => {
    const { elapsedSeconds } = get()
    return Math.max(0, get().getCurrentDuration() - elapsedSeconds)
  },

  getProgress: () => {
    const duration = get().getCurrentDuration()
    if (duration === 0) return 0
    return Math.min(1, get().elapsedSeconds / duration)
  },
}))
