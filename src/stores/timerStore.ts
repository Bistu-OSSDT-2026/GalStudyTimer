import { create } from 'zustand'
import type { TimerStatus, TimerPhase, TimerConfig } from '../types'
import { DEFAULT_FOCUS_MINUTES, DEFAULT_BREAK_MINUTES, DEFAULT_LONG_BREAK_MINUTES, LONG_BREAK_INTERVAL } from '../utils/constants'
import { db } from '../db'
import { getToday } from '../utils/time'
import { checkAndUnlockAchievements } from '../services/achievementService'

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

/**
 * Save a completed study session to the database.
 * Extracted so it can be called directly from the store's finish() action.
 */
async function saveStudySession(params: {
  subjectId: number
  phase: TimerPhase
  elapsedSeconds: number
  focusDurationMinutes: number
}): Promise<void> {
  const { subjectId, phase, elapsedSeconds, focusDurationMinutes } = params

  console.log('[StudyLog] saveStudySession called:', { subjectId, phase, elapsedSeconds })

  if (phase !== 'focus') {
    console.log('[StudyLog] Skipped: not focus phase')
    return
  }

  const now = Date.now()
  const duration = elapsedSeconds > 0 ? elapsedSeconds : focusDurationMinutes * 60

  try {
    const id = await db.studyLogs.add({
      subjectId,
      date: getToday(),
      startTime: now - duration * 1000,
      endTime: now,
      duration,
      type: 'focus',
      completed: true,
    })
    console.log('[StudyLog] ✅ Saved to DB, id:', id, { subjectId, duration, date: getToday() })

    // Update affection
    const existing = await db.affectionScores
      .where('subjectId').equals(subjectId).first()

    const addedMinutes = Math.round(duration / 60)
    if (existing) {
      const newMinutes = existing.totalMinutes + addedMinutes
      const newLevel = Math.min(10, Math.floor(newMinutes / 60) + 1)
      await db.affectionScores.update(existing.id!, { totalMinutes: newMinutes, level: newLevel })
    } else {
      await db.affectionScores.add({ subjectId, totalMinutes: addedMinutes, level: 1 })
    }

    // Check and unlock achievements
    const newlyUnlocked = await checkAndUnlockAchievements()
    if (newlyUnlocked.length > 0) {
      console.log('[Achievement] New unlocks:', newlyUnlocked.map((a) => a.title))
    }
  } catch (err) {
    console.error('[StudyLog] Failed to save:', err)
  }
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
    const state = get()

    // ── Save interrupted session if there was meaningful progress ──
    if (state.phase === 'focus' && state.currentSubjectId !== null && state.elapsedSeconds >= 60) {
      console.log('[StudyLog] Saving interrupted session on reset:', {
        subjectId: state.currentSubjectId,
        elapsedSeconds: state.elapsedSeconds,
      })
      saveStudySession({
        subjectId: state.currentSubjectId,
        phase: state.phase,
        elapsedSeconds: state.elapsedSeconds,
        focusDurationMinutes: state.config.focusDuration,
      })
    }

    set({
      status: 'idle',
      elapsedSeconds: 0,
      pausedAtElapsed: 0,
      sessionStartTime: null,
    })
  },

  finish: () => {
    const state = get()
    console.log('[TimerStore] finish() called:', {
      phase: state.phase,
      currentSubjectId: state.currentSubjectId,
      elapsedSeconds: state.elapsedSeconds,
    })
    const isFocus = state.phase === 'focus'

    // Calculate the correct elapsed time based on the current phase
    let fullDuration: number
    if (state.phase === 'focus') {
      fullDuration = state.config.focusDuration * 60
    } else if (state.phase === 'shortBreak') {
      fullDuration = state.config.shortBreakDuration * 60
    } else {
      fullDuration = state.config.longBreakDuration * 60
    }

    // ── Save study session BEFORE updating state ──
    // This guarantees the log is saved regardless of React lifecycle
    if (isFocus && state.currentSubjectId !== null) {
      saveStudySession({
        subjectId: state.currentSubjectId,
        phase: state.phase,
        elapsedSeconds: state.elapsedSeconds > 0 ? state.elapsedSeconds : fullDuration,
        focusDurationMinutes: state.config.focusDuration,
      })
    }

    set({
      status: 'finished',
      elapsedSeconds: fullDuration,
      totalSessions: isFocus ? state.totalSessions + 1 : state.totalSessions,
      sessionCount: isFocus ? state.sessionCount + 1 : state.sessionCount,
      sessionStartTime: null,
    })
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
