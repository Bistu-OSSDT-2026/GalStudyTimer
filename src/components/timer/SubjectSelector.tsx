import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../../db'
import { useTimerStore } from '../../stores/timerStore'
import type { Subject } from '../../types'

export function SubjectSelector() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const currentSubjectId = useTimerStore((s) => s.currentSubjectId)
  const setSubject = useTimerStore((s) => s.setSubject)
  const navigate = useNavigate()

  useEffect(() => {
    db.subjects.where('isArchived').equals(false).toArray().then(setSubjects)
  }, [])

  const currentSubject = subjects.find((s) => s.id === currentSubjectId)

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Current subject indicator */}
      <AnimatePresence mode="wait">
        {currentSubject ? (
          <motion.div
            key="selected"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full text-sm"
            style={{
              backgroundColor: currentSubject.color + '15',
              border: `1px solid ${currentSubject.color}40`,
              color: currentSubject.color,
            }}
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: currentSubject.color }}
            />
            正在学习: <span className="font-bold">{currentSubject.name}</span>
          </motion.div>
        ) : (
          <motion.div
            key="no-selection"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="text-xs text-amber-400/70 bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full"
          >
            ⚠ 请先选择一个科目再开始计时
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subject buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        {subjects.map((subject) => {
          const isSelected = subject.id === currentSubjectId
          return (
            <motion.button
              key={subject.id}
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 border
                ${isSelected
                  ? 'border-transparent text-white shadow-lg'
                  : 'border-white/10 text-white/40 hover:text-white/70 hover:border-white/20 hover:bg-white/5'
                }`}
              style={isSelected ? {
                backgroundColor: subject.color + '30',
                boxShadow: `0 0 20px ${subject.color}20, 0 4px 12px ${subject.color}10`,
              } : {}}
              onClick={() => setSubject(subject.id!)}
            >
              {subject.spriteData.default ? (
                <img
                  src={subject.spriteData.default}
                  alt=""
                  className="w-4 h-4 rounded-full inline-block mr-1.5 object-cover align-sub"
                />
              ) : (
                <span className="mr-1.5">📖</span>
              )}
              {subject.name}
              {isSelected && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-400 flex items-center justify-center text-[10px] text-white font-bold"
                >
                  ✓
                </motion.span>
              )}
            </motion.button>
          )
        })}
        {/* Link to subject management */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-4 py-2 rounded-xl text-sm font-medium border border-dashed border-white/15 text-white/25 hover:text-white/50 hover:border-white/30 transition-all duration-200"
          onClick={() => navigate('/subjects')}
        >
          + 管理科目
        </motion.button>
      </div>
    </div>
  )
}
