import { motion, AnimatePresence } from 'framer-motion'

interface DialogueBubbleProps {
  message: string | null
  visible: boolean
  onDismiss: () => void
}

export function DialogueBubble({ message, visible, onDismiss }: DialogueBubbleProps) {
  return (
    <AnimatePresence>
      {visible && message && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="absolute -top-20 left-[70%] max-w-xs z-10 cursor-pointer"
          onClick={onDismiss}
        >
          {/* Bubble */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl px-5 py-3 shadow-xl">
            <p className="text-white/90 text-sm leading-relaxed">{message}</p>
          </div>
          {/* Tail */}
          <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/10 ml-8 -mt-px" />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
