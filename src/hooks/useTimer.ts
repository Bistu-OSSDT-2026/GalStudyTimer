import { useEffect, useRef, useCallback } from 'react'
import { useTimerStore } from '../stores/timerStore'
import { useUIStore } from '../stores/uiStore'

export function useTimer() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const encourageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const finishedHandledRef = useRef(false)

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

  // ── UI notifications on timer finish ──
  // The study log save is handled directly inside the store's finish() action
  useEffect(() => {
    const unsub = useTimerStore.subscribe((state, prevState) => {
      if (state.status !== 'finished' || prevState.status === 'finished') return
      if (finishedHandledRef.current) return
      finishedHandledRef.current = true

      showCharacterMessage('timerEnd')
      showNotification(
        '计时结束',
        state.phase === 'focus'
          ? '太棒了！专注时间结束，休息一下吧~'
          : '休息时间结束，准备好继续学习了吗？',
      )

      // Browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('GalStudyTimer', {
          body: state.phase === 'focus'
            ? '✨ 专注时间结束！休息一下吧~'
            : '☕ 休息结束，继续加油！',
          icon: '/icons/icon-192.png',
        })
      }
    })

    return () => { unsub() }
  }, [showCharacterMessage, showNotification])

  // Reset the finished guard when timer restarts
  useEffect(() => {
    if (status === 'running' || status === 'idle') {
      finishedHandledRef.current = false
    }
  }, [status])

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
      // First encouragement after 5 min
      const firstTimeout = setTimeout(() => {
        showCharacterMessage('encourage')
      }, 5 * 60 * 1000)

      // Then every 8 minutes
      encourageTimerRef.current = setInterval(() => {
        showCharacterMessage('encourage')
      }, 8 * 60 * 1000)

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
        tick()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [status, tick])

  // Actions
  const handleStart = useCallback(() => {
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
    status,
    phase,
    currentSubjectId,
    elapsedSeconds,
    remainingSeconds: getRemainingSeconds(),
    totalDuration: getCurrentDuration(),
    progress: getProgress(),
    sessionCount,
    config,

    start: handleStart,
    pause: handlePause,
    resume: handleResume,
    reset: handleReset,
    finish: handleFinish,
  }
}
