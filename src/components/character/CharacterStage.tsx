import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../../db'
import { useTimerStore } from '../../stores/timerStore'
import { useUIStore } from '../../stores/uiStore'
import type { Subject } from '../../types'
import { DialogueBubble } from './DialogueBubble'

interface CharacterStageProps {
  onCharacterClick: () => void
  spinning: boolean
  spinSpeed: number
}

export function CharacterStage({ onCharacterClick, spinning, spinSpeed }: CharacterStageProps) {
  const currentSubjectId = useTimerStore((s) => s.currentSubjectId)
  const status = useTimerStore((s) => s.status)
  const currentMessage = useUIStore((s) => s.currentMessage)
  const isMessageVisible = useUIStore((s) => s.isMessageVisible)
  const hideCharacterMessage = useUIStore((s) => s.hideCharacterMessage)

  const [subject, setSubject] = useState<Subject | null>(null)

  useEffect(() => {
    if (currentSubjectId) {
      db.subjects.get(currentSubjectId).then(setSubject)
    } else {
      setSubject(null)
    }
  }, [currentSubjectId])

  return (
    <div className="relative w-full min-h-[480px] flex items-center justify-center overflow-visible">
      <AnimatePresence mode="wait">
        {subject ? (
          <motion.div
            key={subject.id}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -20 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative flex items-center justify-center"
          >
            {/* Sprite image — clickable, with slow 360° spin */}
            <div
              style={{ transform: `scale(${subject.spriteScale ?? 1})`, transformOrigin: 'center center' }}
            >
            <motion.div
              animate={status === 'running' ? {
                y: [0, -6, 0],
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative group cursor-pointer"
              onClick={() => onCharacterClick()}
              title="点击和角色对话"
            >
              {subject.spriteData.default ? (
                <>
                  {/* 3D Y-axis rotation wrapper with perspective */}
                  <div
                    className="w-[420px] h-[420px] rounded-2xl"
                    style={{
                      perspective: '800px',
                      filter: `drop-shadow(0 0 30px ${subject.color}30) drop-shadow(0 10px 30px rgba(0,0,0,0.3))`,
                    }}
                  >
                    <img
                      src={subject.spriteData.default}
                      alt={subject.name}
                      className="w-full h-full object-contain rounded-2xl transition-transform duration-300 group-hover:scale-105"
                      style={{
                        animation: spinning ? `spin360 ${spinSpeed}s linear infinite` : 'none',
                      }}
                    />
                  </div>
                  {/* Hover hint */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl bg-black/20">
                    <span className="text-white/80 text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
                      💬 对话
                    </span>
                  </div>
                </>
              ) : (
                <div
                  className="w-[420px] h-[420px] rounded-2xl flex flex-col items-center justify-center border border-white/10 transition-transform duration-300 group-hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${subject.color}15, ${subject.color}05)`,
                    boxShadow: `0 0 40px ${subject.color}10, inset 0 0 40px ${subject.color}05`,
                  }}
                >
                  <span className="text-6xl mb-3">📖</span>
                  <span
                    className="text-lg font-medium"
                    style={{ color: subject.color }}
                  >
                    {subject.name}
                  </span>
                  <span className="text-xs text-white/20 mt-1">暂无立绘</span>
                  <span className="text-xs text-white/30 mt-3 bg-white/5 px-3 py-1 rounded-full">
                    💬 点击对话
                  </span>
                </div>
              )}
            </motion.div>

            </div>
            {/* Dialogue bubble — outside scale wrapper, anchors to outer (unscaled) container */}
            <DialogueBubble
              message={currentMessage?.text ?? null}
              visible={isMessageVisible}
              onDismiss={hideCharacterMessage}
            />
          </motion.div>
        ) : (
          <motion.div
            key="no-subject"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <div className="text-6xl mb-4 opacity-20">🎀</div>
            <p className="text-white/20 text-sm">选择一个科目<br />开始学习吧</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer status overlay */}
      {status === 'running' && subject && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
        >
          <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/40">陪伴中...</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}
