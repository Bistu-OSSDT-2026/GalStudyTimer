import { motion } from 'framer-motion'
import { formatTime } from '../../utils/time'
import { ProgressRing } from '../ui/ProgressRing'

interface TimerDisplayProps {
  remainingSeconds: number
  totalDuration: number
  progress: number
  phase: string
  status: string
}

export function TimerDisplay({ remainingSeconds, totalDuration, progress, phase, status }: TimerDisplayProps) {
  const phaseLabel = phase === 'focus' ? '专注' : phase === 'shortBreak' ? '短休息' : '长休息'
  const phaseColor = phase === 'focus'
    ? 'text-primary-400'
    : 'text-emerald-400'

  const ringContent = (
    <ProgressRing progress={progress} size={340} strokeWidth={6}>
      <div className="flex flex-col items-center gap-1">
        <motion.span
          key={remainingSeconds}
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          className={`text-8xl font-light tabular-nums tracking-[0.15em]
            ${status === 'running' ? 'text-white' : 'text-white/70'}`}
        >
          {formatTime(remainingSeconds)}
        </motion.span>
        <span className="text-xs text-white/30">
          {formatTime(totalDuration)}
        </span>
      </div>
    </ProgressRing>
  )

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Phase label */}
      <motion.div
        key={phase}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`text-sm font-medium tracking-widest uppercase ${phaseColor}`}
      >
        {phaseLabel}
      </motion.div>

      {/* Ring — rendered here, AudioVisualizer wraps this via TimerPage */}
      {ringContent}

      {/* Status indicator */}
      {status === 'paused' && (
        <span className="text-amber-400/80 text-sm animate-pulse-soft">⏸ 已暂停</span>
      )}
    </div>
  )
}
