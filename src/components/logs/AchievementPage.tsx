import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { db } from '../../db'
import type { Achievement } from '../../types'

export function AchievementPage() {
  const [achievements, setAchievements] = useState<Achievement[]>([])

  useEffect(() => {
    db.achievements.toArray().then(setAchievements)
  }, [])

  const unlocked = achievements.filter((a) => a.unlockedAt !== null).length

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">成就系统</h2>
      <p className="text-white/40 text-sm mb-6">
        已解锁 {unlocked} / {achievements.length}
      </p>

      {/* Progress bar */}
      <div className="w-full h-1 bg-white/5 rounded-full mb-8">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${achievements.length > 0 ? (unlocked / achievements.length) * 100 : 0}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {achievements.map((a) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card p-5 text-center relative overflow-hidden
              ${a.unlockedAt ? '' : 'opacity-50 grayscale'}`}
          >
            {/* Glow for unlocked */}
            {a.unlockedAt && (
              <div className="absolute inset-0 bg-gradient-to-t from-primary-500/5 to-transparent" />
            )}

            <div className={`text-5xl mb-3 ${a.unlockedAt ? '' : 'grayscale'}`}>
              {a.icon}
            </div>
            <h3 className="font-bold text-sm mb-1">{a.title}</h3>
            <p className="text-xs text-white/40">{a.description}</p>

            {a.unlockedAt ? (
              <div className="text-xs text-primary-400 mt-3">
                ✨ 已解锁
              </div>
            ) : (
              <div className="mt-3">
                <div className="w-full h-1 bg-white/5 rounded-full">
                  <div
                    className="h-full bg-white/20 rounded-full"
                    style={{ width: `${Math.min(100, a.progress)}%` }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}
