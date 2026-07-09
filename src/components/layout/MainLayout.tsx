import { useEffect } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { seedIfEmpty } from '../../db/seeds'
import { useSettingsStore } from '../../stores/settingsStore'
import { useAudioStore } from '../../stores/audioStore'
import { db } from '../../db'
import { MusicPlayerBar } from '../audio/MusicPlayerBar'
import type { AudioTrack, AudioCategory } from '../../types'

const BUILTIN_TRACKS = [
  { name: '雨声', category: 'whitenoise' as AudioCategory, icon: '🌧', noiseType: 'rain' },
  { name: '咖啡厅', category: 'whitenoise' as AudioCategory, icon: '☕', noiseType: 'cafe' },
  { name: '森林', category: 'whitenoise' as AudioCategory, icon: '🌿', noiseType: 'forest' },
  { name: 'Lo-fi', category: 'music' as AudioCategory, icon: '🎧', noiseType: 'lofi' },
]

const NAV_ITEMS = [
  { path: '/', label: '计时', icon: '⏱' },
  { path: '/subjects', label: '科目', icon: '📚' },
  { path: '/audio', label: '音频', icon: '🎵' },
  { path: '/logs', label: '日志', icon: '📊' },
  { path: '/achievements', label: '成就', icon: '🏆' },
  { path: '/settings', label: '设置', icon: '⚙' },
]

export function MainLayout() {
  // Initialize seed data, audio tracks, and settings on app start
  useEffect(() => {
    seedIfEmpty()
    useSettingsStore.getState().load()

    // Seed & load audio tracks once globally
    ;(async () => {
      const count = await db.audioTracks.count()
      if (count === 0) {
        const seeds: Omit<AudioTrack, 'id'>[] = BUILTIN_TRACKS.map((t) => ({
          name: t.name,
          category: t.category,
          source: 'builtin' as const,
          volume: 1,
          isLooping: true,
        }))
        await db.audioTracks.bulkAdd(seeds)
      }
      const all = await db.audioTracks.toArray()
      useAudioStore.setState({ tracks: all })
    })()
  }, [])

  return (
    <div className="flex flex-col h-screen">
      {/* Top music player bar */}
      <MusicPlayerBar />

      <div className="flex flex-1 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-16 border-r border-white/5 flex flex-col items-center py-4 gap-1 bg-surface-900/60 backdrop-blur-sm">
        {/* Logo */}
        <div className="mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-sm font-bold shadow-lg shadow-primary-500/20">
            GS
          </div>
        </div>

        {/* Nav */}
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={item.label}
            className={({ isActive }) =>
              `w-11 h-11 flex items-center justify-center rounded-xl text-lg transition-all duration-200
              ${isActive
                ? 'bg-primary-600/20 text-primary-400 shadow-lg shadow-primary-500/5'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`
            }
          >
            {item.icon}
          </NavLink>
        ))}
      </aside>

      {/* Main content — transparent to show body background */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
      </div>
    </div>
  )
}
