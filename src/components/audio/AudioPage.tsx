import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { db } from '../../db'
import { useAudioStore } from '../../stores/audioStore'
import { AudioFilePicker } from './AudioFilePicker'
import {
  playBuiltIn,
  playUserTrack,
  stopAllBuiltIn,
  stopAllUserTracks,
  stopAll,
  setMasterVolume,
  resumeAudioContext,
  isTrackPlaying,
} from '../../services/audioService'
import type { AudioTrack, AudioCategory } from '../../types'

// Built-in tracks definition — actual audio generated via Web Audio API
const BUILTIN_TRACKS = [
  { name: '雨声', category: 'whitenoise' as AudioCategory, icon: '🌧', noiseType: 'rain' },
  { name: '咖啡厅', category: 'whitenoise' as AudioCategory, icon: '☕', noiseType: 'cafe' },
  { name: '森林', category: 'whitenoise' as AudioCategory, icon: '🌿', noiseType: 'forest' },
  { name: 'Lo-fi', category: 'music' as AudioCategory, icon: '🎧', noiseType: 'lofi' },
]

export function AudioPage() {
  const {
    tracks, currentTrackId, isPlaying, masterVolume, category,
    addTrack, play, pause, setVolume, setCategory,
  } = useAudioStore()

  const [uploadOpen, setUploadOpen] = useState(false)
  const [initialized, setInitialized] = useState(false)
  // Track which built-in track key is active (e.g. 'builtin:rain')
  const [activeBuiltIn, setActiveBuiltIn] = useState<string | null>(null)
  // Track which user track id is active
  const [activeUserTrack, setActiveUserTrack] = useState<number | null>(null)

  // Seed built-in tracks on first load
  useEffect(() => {
    if (initialized) return
    db.audioTracks.count().then(async (count) => {
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
      // Load all tracks into store
      const all = await db.audioTracks.toArray()
      useAudioStore.setState({ tracks: all })
      setInitialized(true)
    })
  }, [initialized])

  // Sync master volume
  useEffect(() => {
    setMasterVolume(masterVolume)
  }, [masterVolume])

  // Get the built-in noise type for a track name
  const getNoiseType = useCallback((trackName: string): string | null => {
    const found = BUILTIN_TRACKS.find((t) => t.name === trackName)
    return found?.noiseType ?? null
  }, [])

  // Handle play
  const handlePlay = useCallback(async (track: AudioTrack) => {
    resumeAudioContext()

    if (track.source === 'builtin') {
      // Stop any user tracks
      stopAllUserTracks()
      setActiveUserTrack(null)

      const noiseType = getNoiseType(track.name)
      if (noiseType) {
        const vol = masterVolume / 100
        playBuiltIn(noiseType as 'rain' | 'cafe' | 'forest' | 'lofi', vol)
        const key = `builtin:${noiseType}`
        setActiveBuiltIn(key)
        play()
        useAudioStore.setState({ currentTrackId: track.id!, isPlaying: true })
      }
    } else if (track.source === 'user' && track.blobKey) {
      // Stop any built-in tracks
      stopAllBuiltIn()
      setActiveBuiltIn(null)

      // Load blob and play
      const entry = await db.blobStore.get(track.blobKey)
      if (entry) {
        const vol = masterVolume / 100
        await playUserTrack(track.id!, entry.blob, vol)
        setActiveUserTrack(track.id!)
        play()
        useAudioStore.setState({ currentTrackId: track.id!, isPlaying: true })
      }
    }
  }, [masterVolume, getNoiseType, play])

  // Handle pause
  const handlePause = useCallback(() => {
    stopAll()
    setActiveBuiltIn(null)
    setActiveUserTrack(null)
    pause()
  }, [pause])

  // Handle volume
  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol)
  }, [setVolume])

  // Handle file upload + auto-play
  const handleUpload = useCallback(async (file: File, name: string, category: AudioCategory) => {
    // Store blob
    const blobKey = `audio_${Date.now()}_${name}`
    await db.blobStore.put({ key: blobKey, blob: file })

    // Add track metadata
    const id = await db.audioTracks.add({
      name,
      category,
      source: 'user',
      blobKey,
      volume: 1,
      isLooping: true,
    })

    // Refresh track list
    const all = await db.audioTracks.toArray()
    useAudioStore.setState({ tracks: all })

    // Auto-play the newly uploaded track
    const newTrack: AudioTrack = {
      id,
      name,
      category,
      source: 'user',
      blobKey,
      volume: 1,
      isLooping: true,
    }

    // Short delay to ensure blob is committed
    setTimeout(() => handlePlay(newTrack), 200)
  }, [handlePlay])

  // Filter tracks by category
  const filtered = category
    ? tracks.filter((t) => t.category === category)
    : tracks

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-2">音频设置</h2>
      <p className="text-white/40 text-sm mb-6">
        选择背景音乐或白噪音，为专注学习创造氛围
      </p>

      {/* Category tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: null, label: '全部' },
          { key: 'whitenoise' as AudioCategory, label: '🌧 白噪音' },
          { key: 'music' as AudioCategory, label: '🎵 轻音乐' },
        ].map((tab) => (
          <button
            key={String(tab.key)}
            className={`px-4 py-2 rounded-lg text-sm transition-all
              ${category === tab.key ? 'bg-primary-600/20 text-primary-400 border border-primary-500/30' : 'btn-ghost'}`}
            onClick={() => setCategory(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Track list */}
      <div className="space-y-2 max-h-80 overflow-auto mb-6">
        {filtered.map((track) => {
          const builtinInfo = BUILTIN_TRACKS.find((t) => t.name === track.name)
          const trackKey = track.source === 'builtin'
            ? `builtin:${builtinInfo?.noiseType ?? track.name}`
            : `user:${track.id}`
          const isTrackActive = trackKey === activeBuiltIn || track.id === activeUserTrack
          const isTrackPlaying = isTrackActive && isPlaying

          return (
            <motion.div
              key={track.id ?? track.name}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`glass-card p-4 flex items-center justify-between cursor-pointer transition-colors
                ${isTrackActive ? 'border-primary-500/40 bg-primary-500/10 shadow-lg shadow-primary-500/5' : ''}`}
              onClick={() => isTrackPlaying ? handlePause() : handlePlay(track)}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">
                  {builtinInfo?.icon ?? (track.category === 'whitenoise' ? '🌧' : '🎵')}
                </span>
                <div>
                  <div className="font-medium text-sm">
                    {track.name}
                    {track.source === 'builtin' && (
                      <span className="text-[10px] text-white/20 ml-1.5 bg-white/5 px-1.5 py-0.5 rounded">内置</span>
                    )}
                  </div>
                  <div className="text-xs text-white/30 mt-0.5">
                    {isTrackPlaying ? '🔊 播放中' : '点击播放'}
                  </div>
                </div>
              </div>
              <motion.div
                animate={isTrackPlaying ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
                className={`text-xl w-10 h-10 flex items-center justify-center rounded-full
                  ${isTrackPlaying ? 'bg-primary-500/20 text-primary-400' : 'text-white/30'}`}
              >
                {isTrackPlaying ? '⏸' : '▶'}
              </motion.div>
            </motion.div>
          )
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/20">
            <div className="text-5xl mb-3">🎵</div>
            <p>暂无音频</p>
            <p className="text-sm mt-1">点击下方按钮上传你的音乐文件</p>
          </div>
        )}
      </div>

      {/* Master volume */}
      <div className="mb-4">
        <label className="text-sm text-white/40 mb-2 block">
          主音量: {masterVolume}%
        </label>
        <input
          type="range"
          min={0}
          max={100}
          value={masterVolume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Upload */}
      <button className="btn-ghost w-full" onClick={() => setUploadOpen(true)}>
        + 上传 MP3/WAV 音频
      </button>

      {/* Stop all */}
      {(activeBuiltIn || activeUserTrack) && (
        <button
          className="btn-ghost w-full mt-2 text-red-400 hover:text-red-300"
          onClick={handlePause}
        >
          ⏹ 停止播放
        </button>
      )}

      {/* Upload modal */}
      <AudioFilePicker
        isOpen={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}
