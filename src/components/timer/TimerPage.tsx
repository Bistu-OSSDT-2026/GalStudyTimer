import { useState, useEffect } from 'react'
import { useTimer } from '../../hooks/useTimer'
import { motion } from 'framer-motion'
import { formatTime } from '../../utils/time'
import { ProgressRing } from '../ui/ProgressRing'
import { TimerControls } from './TimerControls'
import { TimerSettings } from './TimerSettings'
import { SubjectSelector } from './SubjectSelector'
import { CharacterStage } from '../character/CharacterStage'
import { CharacterDialog } from '../character/CharacterDialog'
import { Notification } from '../ui/Notification'
import { AudioVisualizer } from '../ui/AudioVisualizer'
import { useTimerStore } from '../../stores/timerStore'
import { db } from '../../db'
import type { Subject } from '../../types'

export function TimerPage() {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [chatSubject, setChatSubject] = useState<Subject | null>(null)
  const currentSubjectId = useTimerStore((s) => s.currentSubjectId)

  const {
    status, phase, remainingSeconds, totalDuration, progress,
    sessionCount,
    start, pause, resume, reset, finish,
  } = useTimer()

  // Sync chat subject with selected subject
  useEffect(() => {
    if (currentSubjectId) {
      db.subjects.get(currentSubjectId).then((s) => {
        if (s) setChatSubject(s)
      })
    } else {
      setChatSubject(null)
      setChatOpen(false)
    }
  }, [currentSubjectId])

  return (
    <div className="h-full flex flex-col">
      {/* Main content area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 p-8 relative overflow-auto">
        {/* Left: Subject selector + Character */}
        <div className="flex flex-col items-center justify-center gap-6 order-2 lg:order-1">
          <SubjectSelector />
          <CharacterStage onCharacterClick={() => setChatOpen(!chatOpen)} />
        </div>

        {/* Right: Timer */}
        <div className="flex flex-col items-center justify-center gap-8 order-1 lg:order-2">
          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-light">
              <span className="text-gradient">GalStudy</span>
              <span className="text-white/40 font-thin">Timer</span>
            </h1>
          </div>

          {/* Phase label + Ring with visualizer + Status */}
          <div className="flex flex-col items-center gap-3">
            {/* Phase label — outside visualizer */}
            <motion.div
              key={phase}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-sm font-medium tracking-widest uppercase
                ${phase === 'focus' ? 'text-primary-400' : 'text-emerald-400'}`}
            >
              {phase === 'focus' ? '专注' : phase === 'shortBreak' ? '短休息' : '长休息'}
            </motion.div>

            {/* Ring centered in visualizer canvas */}
            <AudioVisualizer>
              <ProgressRing progress={progress} size={340} strokeWidth={6}>
                <div className="flex flex-col items-center gap-1">
                  {(() => {
                    const [m, s] = formatTime(remainingSeconds).split(':')
                    return (
                      <motion.span
                        key={remainingSeconds}
                        initial={{ scale: 1.05 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-baseline gap-[0.05em] text-8xl font-light
                          ${status === 'running' ? 'text-white' : 'text-white/70'}`}
                      >
                        <span className="tabular-nums tracking-[0.15em]">{m}</span>
                        <span className="w-[0.28em] text-center inline-block">:</span>
                        <span className="tabular-nums tracking-[0.15em]">{s}</span>
                      </motion.span>
                    )
                  })()}

                  <span className="text-xs text-white/30">
                    {formatTime(totalDuration)}
                  </span>
                </div>
              </ProgressRing>
            </AudioVisualizer>

            {/* Status — outside visualizer */}
            {status === 'paused' && (
              <span className="text-amber-400/80 text-sm animate-pulse-soft">⏸ 已暂停</span>
            )}
          </div>

          {/* Controls */}
          <TimerControls
            status={status}
            hasSubject={currentSubjectId !== null}
            onStart={start}
            onPause={pause}
            onResume={resume}
            onReset={reset}
            onFinish={finish}
          />
        </div>

        {/* Settings button */}
        <button
          className="absolute top-4 right-4 btn-ghost text-sm"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙ 计时设置
        </button>

        {/* Session counter */}
        {status !== 'idle' && (
          <div className="absolute top-4 left-4 text-xs text-white/20">
            当前阶段: {phase === 'focus' ? `第 ${(sessionCount % 4) + 1} 个番茄钟` : '休息时间'}
          </div>
        )}
      </div>

      {/* Bottom: AI Chat panel */}
      <CharacterDialog
        isOpen={chatOpen}
        onToggle={() => setChatOpen(!chatOpen)}
        subject={chatSubject}
      />

      {/* Settings modal */}
      <TimerSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />

      {/* Notifications */}
      <Notification />
    </div>
  )
}
