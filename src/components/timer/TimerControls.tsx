import { motion } from 'framer-motion'
import type { TimerStatus } from '../../types'

interface TimerControlsProps {
  status: TimerStatus
  hasSubject: boolean
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onFinish: () => void
}

export function TimerControls({ status, hasSubject, onStart, onPause, onResume, onReset, onFinish }: TimerControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {status === 'idle' && (
        <div className="flex flex-col items-center gap-2">
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={`text-lg px-8 py-4 rounded-2xl shadow-lg transition-all duration-200
              ${hasSubject
                ? 'btn-primary shadow-primary-600/20 cursor-pointer'
                : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
              }`}
            onClick={hasSubject ? onStart : undefined}
            disabled={!hasSubject}
            title={hasSubject ? '开始专注' : '请先在上方选择一个科目'}
          >
            ▶ 开始专注
          </motion.button>
          {!hasSubject && (
            <span className="text-xs text-amber-400/60">⚠ 请先选择科目</span>
          )}
        </div>
      )}

      {status === 'running' && (
        <>
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="btn-ghost"
            onClick={onReset}
          >
            ↺ 重置
          </motion.button>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="btn-primary text-lg px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400"
            onClick={onPause}
          >
            ⏸ 暂停
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="btn-ghost"
            onClick={onFinish}
          >
            ⏹ 结束
          </motion.button>
        </>
      )}

      {status === 'paused' && (
        <>
          <motion.button
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="btn-ghost"
            onClick={onReset}
          >
            ↺ 重置
          </motion.button>
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="btn-primary text-lg px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            onClick={onResume}
          >
            ▶ 继续
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="btn-ghost"
            onClick={onFinish}
          >
            ⏹ 结束
          </motion.button>
        </>
      )}

      {status === 'finished' && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="btn-primary text-lg px-8 py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
          onClick={onStart}
        >
          ✨ 开始下一轮
        </motion.button>
      )}
    </div>
  )
}
