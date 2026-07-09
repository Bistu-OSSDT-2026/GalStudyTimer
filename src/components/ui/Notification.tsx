import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useUIStore } from '../../stores/uiStore'

export function Notification() {
  const queue = useUIStore((s) => s.notificationQueue)
  const dismiss = useUIStore((s) => s.dismissNotification)

  useEffect(() => {
    if (queue.length > 0) {
      const timer = setTimeout(dismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [queue.length])

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {queue.slice(0, 3).map((n, i) => (
          <motion.div
            key={`${n.title}-${i}`}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            className="glass px-5 py-3 min-w-[280px] max-w-sm cursor-pointer"
            onClick={dismiss}
          >
            <div className="font-medium text-sm">{n.title}</div>
            <div className="text-xs text-white/50 mt-0.5">{n.body}</div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
