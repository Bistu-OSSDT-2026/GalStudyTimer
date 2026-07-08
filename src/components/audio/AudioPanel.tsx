import { useState } from 'react'
import { motion } from 'framer-motion'
import type { AudioCategory, AudioTrack } from '../../types'

interface AudioPanelProps {
  tracks: AudioTrack[]
  currentTrackId: number | null
  isPlaying: boolean
  masterVolume: number
  category: AudioCategory | null
  onPlay: (trackId: number) => void
  onPause: () => void
  onVolumeChange: (volume: number) => void
  onCategoryChange: (category: AudioCategory | null) => void
  onUploadClick: () => void
}

export function AudioPanel({
  tracks,
  currentTrackId,
  isPlaying,
  masterVolume,
  category,
  onPlay,
  onPause,
  onVolumeChange,
  onCategoryChange,
  onUploadClick,
}: AudioPanelProps) {
  const filtered = category
    ? tracks.filter((t) => t.category === category)
    : tracks

  return (
    <div className="space-y-6">
      {/* Category tabs */}
      <div className="flex gap-2">
        {[
          { key: null, label: '全部' },
          { key: 'whitenoise' as AudioCategory, label: '🌧 白噪音' },
          { key: 'music' as AudioCategory, label: '🎵 轻音乐' },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-all
              ${category === tab.key ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' : 'btn-ghost'}`}
            onClick={() => onCategoryChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="space-y-2 max-h-80 overflow-auto">
        {filtered.map((track) => {
          const isCurrent = track.id === currentTrackId
          const isTrackPlaying = isCurrent && isPlaying

          return (
            <motion.div
              key={track.id}
              whileHover={{ scale: 1.01 }}
              className={`glass-card p-4 flex items-center justify-between cursor-pointer
                ${isCurrent ? 'border-primary-500/30 bg-primary-500/5' : ''}`}
              onClick={() => isTrackPlaying ? onPause() : onPlay(track.id!)}
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">
                  {track.category === 'whitenoise' ? '🌧' : '🎵'}
                </span>
                <div>
                  <div className="font-medium text-sm">{track.name}</div>
                  <div className="text-xs text-white/30">
                    {track.source === 'builtin' ? '内置' : '自定义'}
                    {isTrackPlaying && ' · 播放中'}
                  </div>
                </div>
              </div>
              <div className="text-lg">
                {isTrackPlaying ? '⏸' : '▶'}
              </div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-white/20 text-sm">
            暂无音频，点击上方按钮上传
          </div>
        )}
      </div>

      {/* Master volume */}
      <div>
        <label className="text-sm text-white/40 mb-2 block">
          主音量: {masterVolume}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={masterVolume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Upload */}
      <button className="btn-ghost w-full" onClick={onUploadClick}>
        + 上传音频文件
      </button>
    </div>
  )
}
