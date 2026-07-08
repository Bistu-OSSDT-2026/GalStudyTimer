import { motion, AnimatePresence } from 'framer-motion'
import { useTimerStore } from '../../stores/timerStore'
import { FOCUS_DURATION_MIN, FOCUS_DURATION_MAX, BREAK_DURATION_MIN, BREAK_DURATION_MAX } from '../../utils/constants'

interface TimerSettingsProps {
  isOpen: boolean
  onClose: () => void
}

const PRESETS = [
  { label: '15分钟', focus: 15, break: 3 },
  { label: '25分钟', focus: 25, break: 5 },
  { label: '45分钟', focus: 45, break: 10 },
  { label: '60分钟', focus: 60, break: 15 },
]

export function TimerSettings({ isOpen, onClose }: TimerSettingsProps) {
  const config = useTimerStore((s) => s.config)
  const updateConfig = useTimerStore((s) => s.updateConfig)

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass p-6 w-96 max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-4">计时设置</h3>

          {/* Presets */}
          <div className="grid grid-cols-4 gap-2 mb-6">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                className={`glass-input text-sm py-2 px-1 text-center cursor-pointer
                  ${config.focusDuration === p.focus ? 'border-primary-500 bg-primary-500/10' : ''}`}
                onClick={() => updateConfig({
                  focusDuration: p.focus,
                  shortBreakDuration: p.break,
                })}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom durations */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-white/60 mb-2 block">专注时长（分钟）</label>
              <input
                type="range"
                min={FOCUS_DURATION_MIN}
                max={FOCUS_DURATION_MAX}
                step={5}
                value={config.focusDuration}
                onChange={(e) => updateConfig({ focusDuration: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-white/30">
                <span>{FOCUS_DURATION_MIN}分钟</span>
                <span className="text-primary-400 font-medium">{config.focusDuration}分钟</span>
                <span>{FOCUS_DURATION_MAX}分钟</span>
              </div>
            </div>

            <div>
              <label className="text-sm text-white/60 mb-2 block">休息时长（分钟）</label>
              <input
                type="range"
                min={BREAK_DURATION_MIN}
                max={BREAK_DURATION_MAX}
                step={1}
                value={config.shortBreakDuration}
                onChange={(e) => updateConfig({ shortBreakDuration: Number(e.target.value) })}
                className="w-full accent-primary-500"
              />
              <div className="flex justify-between text-xs text-white/30">
                <span>{BREAK_DURATION_MIN}分钟</span>
                <span className="text-primary-400 font-medium">{config.shortBreakDuration}分钟</span>
                <span>{BREAK_DURATION_MAX}分钟</span>
              </div>
            </div>
          </div>

          <button className="btn-ghost w-full mt-6" onClick={onClose}>
            关闭
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
