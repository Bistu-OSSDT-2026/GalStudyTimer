import { useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts'
import { db } from '../../db'
import { formatDate, formatDuration, getToday } from '../../utils/time'
import type { StudyLog, Subject } from '../../types'

interface DailyData {
  date: string      // YYYY-MM-DD
  label: string     // MM-DD for display
  minutes: number
}

export function LogsPage() {
  const [logs, setLogs] = useState<StudyLog[]>([])
  const [subjects, setSubjects] = useState<Map<number, Subject>>(new Map())
  const [filter, setFilter] = useState<'all' | 'today' | 'week'>('all')
  const [chartData, setChartData] = useState<DailyData[]>([])
  // Key to force refresh when page regains focus
  const [refreshKey, setRefreshKey] = useState(0)

  // Refresh data when navigating back to this page
  useEffect(() => {
    const handleFocus = () => setRefreshKey((k) => k + 1)
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Refresh on mount and when filter changes
  useEffect(() => {
    db.subjects.toArray().then((sList) => {
      const map = new Map<number, Subject>()
      sList.forEach((s) => s.id && map.set(s.id, s))
      setSubjects(map)
    }).catch((err) => {
      console.error('[LogsPage] Failed to load subjects:', err)
    })
  }, [])

  // Fetch logs — sort in JS instead of orderBy() since startTime is not indexed
  useEffect(() => {
    console.log('[LogsPage] Fetching logs, filter:', filter, 'refreshKey:', refreshKey)

    const promise = filter === 'all'
      ? db.studyLogs.toArray()
      : filter === 'today'
        ? db.studyLogs.where('date').equals(getToday()).toArray()
        : (async () => {
            // Week filter: fetch recent logs and filter by week in JS
            const now = new Date()
            const dayOfWeek = now.getDay()
            const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
            const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
            const mondayStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`
            const all = await db.studyLogs.toArray()
            return all.filter((l) => l.date >= mondayStr)
          })()

    promise.then((result) => {
      // Sort by startTime descending in JS
      result.sort((a, b) => b.startTime - a.startTime)
      const sliced = result.slice(0, 100)
      console.log('[LogsPage] Loaded logs:', sliced.length)
      setLogs(sliced)
    }).catch((err) => {
      console.error('[LogsPage] Failed to load logs:', err)
    })
  }, [filter, refreshKey])

  // Load ALL focus logs for the chart (aggregated by day)
  useEffect(() => {
    db.studyLogs
      .where('type')
      .equals('focus')
      .toArray()
      .then((focusLogs) => {
        // Aggregate by date
        const dailyMap = new Map<string, number>()
        for (const log of focusLogs) {
          const prev = dailyMap.get(log.date) ?? 0
          dailyMap.set(log.date, prev + Math.round(log.duration / 60))
        }
        // Sort by date ascending and convert to array
        const sorted = [...dailyMap.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([date, minutes]) => ({
            date,
            label: date.slice(5), // MM-DD
            minutes,
          }))
        setChartData(sorted)
      })
      .catch((err) => {
        console.error('[LogsPage] Failed to load chart data:', err)
      })
  }, [logs.length, refreshKey])

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

      {/* ── Daily study chart ── */}
      {chartData.length > 0 && (
        <div className="glass-card p-5 mb-6">
          <h3 className="text-sm font-medium text-white/60 mb-4">📈 每日学习趋势</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                tickLine={false}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: 'rgba(255,255,255,0.35)' }}
                tickLine={false}
                axisLine={false}
                width={36}
                label={{
                  value: '分钟',
                  position: 'insideTopLeft',
                  offset: 4,
                  style: { fontSize: 10, fill: 'rgba(255,255,255,0.25)' },
                }}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(30,30,40,0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 13,
                  color: '#fff',
                }}
                labelFormatter={(label) => `📅 ${label}`}
                formatter={(value: number) => [
                  <span className="text-gradient font-bold">{`${value} 分钟`}</span>,
                  '学习时长',
                ]}
              />
              <Line
                type="monotone"
                dataKey="minutes"
                stroke="url(#chartGradient)"
                strokeWidth={2.5}
                dot={{
                  r: 3,
                  fill: '#a78bfa',
                  stroke: 'rgba(167,139,250,0.3)',
                  strokeWidth: 4,
                }}
                activeDot={{
                  r: 5,
                  fill: '#c4b5fd',
                  stroke: 'rgba(196,181,253,0.5)',
                  strokeWidth: 6,
                }}
              />
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#7c3aed" />
                  <stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>
              </defs>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

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
