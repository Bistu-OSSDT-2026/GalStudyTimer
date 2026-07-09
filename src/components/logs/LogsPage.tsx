import { useEffect, useState } from 'react'
import { db } from '../../db'
import { formatDate, formatDuration, getToday } from '../../utils/time'
import type { StudyLog, Subject } from '../../types'

export function LogsPage() {
  const [logs, setLogs] = useState<StudyLog[]>([])
  const [subjects, setSubjects] = useState<Map<number, Subject>>(new Map())
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')

  useEffect(() => {
    db.subjects.toArray().then((sList) => {
      const map = new Map<number, Subject>()
      sList.forEach((s) => s.id && map.set(s.id, s))
      setSubjects(map)
    })
  }, [])

  useEffect(() => {
    let query = db.studyLogs.orderBy('startTime').reverse()
    if (filter === 'today') {
      query = query.filter((l) => l.date === getToday()) as typeof query
    }
    query.limit(100).toArray().then(setLogs)
  }, [filter])

  const totalMinutes = logs.reduce((sum, l) => sum + l.duration / 60, 0)
  const focusLogs = logs.filter((l) => l.type === 'focus')
  const todayLogs = logs.filter((l) => l.date === getToday())

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">学习日志</h2>
      <p className="text-white/40 text-sm mb-6">记录每一次专注时光</p>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-gradient">{focusLogs.length}</div>
          <div className="text-xs text-white/40 mt-1">完成番茄钟</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-gradient">{Math.round(totalMinutes)}</div>
          <div className="text-xs text-white/40 mt-1">累计学习(分钟)</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-gradient">{todayLogs.length}</div>
          <div className="text-xs text-white/40 mt-1">今日完成</div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {([
          { key: 'all', label: '全部' },
          { key: 'today', label: '今日' },
          { key: 'week', label: '本周' },
        ] as const).map((f) => (
          <button
            key={f.key}
            className={`px-4 py-2 rounded-lg text-sm ${filter === f.key ? 'bg-primary-600/20 text-primary-400' : 'btn-ghost'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Log list */}
      <div className="space-y-2">
        {logs.map((log) => {
          const subject = log.subjectId ? subjects.get(log.subjectId) : null
          return (
            <div key={log.id} className="glass-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: subject?.color ?? '#666' }}
                />
                <div>
                  <div className="font-medium text-sm">
                    {subject?.name ?? '未知科目'}
                    <span className="text-white/30 text-xs ml-2">
                      {log.type === 'focus' ? '🍅 专注' : '☕ 休息'}
                    </span>
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">
                    {formatDate(new Date(log.startTime))}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono text-sm">{formatDuration(Math.round(log.duration / 60))}</div>
                <div className="text-xs text-white/20">
                  {log.completed ? '✅ 完成' : '⏹ 中断'}
                </div>
              </div>
            </div>
          )
        })}
        {logs.length === 0 && (
          <div className="text-center py-16 text-white/20">
            <div className="text-5xl mb-3">📝</div>
            <p>还没有学习记录</p>
            <p className="text-sm mt-1">开始第一个番茄钟吧~</p>
          </div>
        )}
      </div>
    </div>
  )
}
