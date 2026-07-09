import { useEffect, useRef, useCallback } from 'react'
import { useTimerStore } from '../stores/timerStore'
import { useUIStore } from '../stores/uiStore'
import { useAudioStore } from '../stores/audioStore'
import { db } from '../db'
import { getToday } from '../utils/time'

export function useTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const encourageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const {
    status, phase, currentSubjectId, elapsedSeconds,
    config, sessionCount,
    start, pause, resume, reset, finish, tick,
    getCurrentDuration, getRemainingSeconds, getProgress,
  } = useTimerStore()

  const showCharacterMessage = useUIStore((s) => s.showCharacterMessage)
  const showNotification = useUIStore((s) => s.showNotification)

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      if (encourageTimerRef.current) clearInterval(encourageTimerRef.current)
    }
  }, [])

  // Main timer tick
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [status, tick])

  // Encouragement messages during focus
  useEffect(() => {
    if (status === 'running' && phase === 'focus') {
      // Show first encouragement after 5 minutes, then every 8 minutes
      encourageTimerRef.current = setInterval(() => {
        showCharacterMessage('encourage')
      }, 8 * 60 * 1000)

      // First encouragement after 5 min
      const firstTimeout = setTimeout(() => {
        showCharacterMessage('encourage')
      }, 5 * 60 * 1000)

      return () => {
        clearTimeout(firstTimeout)
        if (encourageTimerRef.current) {
          clearInterval(encourageTimerRef.current)
          encourageTimerRef.current = null
        }
      }
    }
  }, [status, phase, showCharacterMessage])

  // Tab visibility — recalibrate on return
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && status === 'running') {
        // Force a tick to recalculate from Date.now()
        tick()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [status, tick])

  // Handle timer finish
  useEffect(() => {
    if (status === 'finished') {
      // Auto-save log for focus sessions
      if (phase === 'focus' && currentSubjectId) {
        const duration = config.focusDuration * 60
        const now = Date.now()
        db.studyLogs.add({
          subjectId: currentSubjectId,
          date: getToday(),
          startTime: now - duration * 1000,
          endTime: now,
          duration,
          type: 'focus',
          completed: true,
        })

        // Update affection
        db.affectionScores
          .where('subjectId')
          .equals(currentSubjectId)
          .first()
          .then((existing) => {
            if (existing) {
              const newMinutes = existing.totalMinutes + config.focusDuration
              const newLevel = Math.min(10, Math.floor(newMinutes / 60) + 1)
              db.affectionScores.update(existing.id!, {
                totalMinutes: newMinutes,
                level: newLevel,
              })
            } else {
              db.affectionScores.add({
                subjectId: currentSubjectId,
                totalMinutes: config.focusDuration,
                level: 1,
              })
            }
          })
      }

      showCharacterMessage('timerEnd')
      showNotification('计时结束', phase === 'focus' ? '太棒了！专注时间结束，休息一下吧~' : '休息时间结束，准备好继续学习了吗？')

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('GalStudyTimer', {
          body: phase === 'focus' ? '✨ 专注时间结束！休息一下吧~' : '☕ 休息结束，继续加油！',
          icon: '/icons/icon-192.png',
        })
      }
    }
  }, [status])

  // Actions
  const handleStart = useCallback(() => {
    // Request notification permission on first start
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
    showCharacterMessage('timerStart')
    start()
  }, [start, showCharacterMessage])

  const handlePause = useCallback(() => pause(), [pause])
  const handleResume = useCallback(() => resume(), [resume])
  const handleReset = useCallback(() => reset(), [reset])
  const handleFinish = useCallback(() => finish(), [finish])

  return {
    // State
    status,
    phase,
    currentSubjectId,
    elapsedSeconds,
    remainingSeconds: getRemainingSeconds(),
    totalDuration: getCurrentDuration(),
    progress: getProgress(),
    sessionCount,
    config,

    // Actions
    start: handleStart,
    pause: handlePause,
    resume: handleResume,
    reset: handleReset,
    finish: handleFinish,
  }
}
