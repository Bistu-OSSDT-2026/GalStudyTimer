import { useEffect, useState, useCallback, useRef } from 'react'
import { useAudioStore } from '../../stores/audioStore'
import { db } from '../../db'
import {
  playBuiltIn,
  playUserTrack,
  stopAllBuiltIn,
  stopAllUserTracks,
  stopAll,
  setMasterVolume,
  resumeAudioContext,
  getTrackPosition,
  seekTrack,
} from '../../services/audioService'
import type { AudioTrack, AudioCategory } from '../../types'

const BUILTIN_TRACKS = [
  { name: '雨声', category: 'whitenoise' as AudioCategory, icon: '🌧', noiseType: 'rain' },
  { name: '咖啡厅', category: 'whitenoise' as AudioCategory, icon: '☕', noiseType: 'cafe' },
  { name: '森林', category: 'whitenoise' as AudioCategory, icon: '🌿', noiseType: 'forest' },
  { name: 'Lo-fi', category: 'music' as AudioCategory, icon: '🎧', noiseType: 'lofi' },
]

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function MusicPlayerBar() {
  const { tracks, currentTrackId, isPlaying, masterVolume, setVolume } = useAudioStore()
  const [position, setPosition] = useState(0)
  const [duration, setDuration] = useState(0)
  const [seeking, setSeeking] = useState(false)
  const seekRef = useRef<number>(0)
  const rafRef = useRef<number>(0)

  const tracksReady = tracks.length > 0

  // Sync master volume to audio service
  useEffect(() => {
    setMasterVolume(masterVolume)
  }, [masterVolume])

  // Poll track position for progress bar
  useEffect(() => {
    const tick = () => {
      const pos = getTrackPosition()
      if (pos) {
        setPosition(seeking ? seekRef.current : pos.position)
        setDuration(pos.duration)
      } else {
        setPosition(0)
        setDuration(0)
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [isPlaying, currentTrackId, seeking])

  const currentTrack = tracks.find((t) => t.id === currentTrackId) ?? null
  const builtinInfo = currentTrack
    ? BUILTIN_TRACKS.find((t) => t.name === currentTrack.name)
    : null

  const hasProgress = duration > 0 && currentTrack?.source === 'user'

  // Get sorted track list for prev/next
  const sortedTracks = [...tracks].sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
  const currentIndex = sortedTracks.findIndex((t) => t.id === currentTrackId)

  const handlePlay = useCallback(async (track?: AudioTrack) => {
    const state = useAudioStore.getState()
    const t = track ?? state.tracks.find((tr) => tr.id === state.currentTrackId) ?? state.tracks.find((tr) => tr.source === 'builtin') ?? null
    if (!t) return
    const vol = state.masterVolume / 100
    resumeAudioContext()

    if (t.source === 'builtin') {
      stopAllUserTracks()
      const info = BUILTIN_TRACKS.find((bt) => bt.name === t.name)
      if (info) {
        playBuiltIn(info.noiseType as 'rain' | 'cafe' | 'forest' | 'lofi', vol)
        useAudioStore.setState({ currentTrackId: t.id!, isPlaying: true })
      }
    } else if (t.source === 'user' && t.blobKey) {
      stopAllBuiltIn()
      const entry = await db.blobStore.get(t.blobKey)
      if (entry) {
        await playUserTrack(t.id!, entry.blob, vol)
        useAudioStore.setState({ currentTrackId: t.id!, isPlaying: true })
      }
    }
  }, [])

  const handlePause = useCallback(() => {
    stopAll()
    useAudioStore.setState({ isPlaying: false })
  }, [])

  const handleToggle = useCallback(() => {
    if (useAudioStore.getState().isPlaying) {
      handlePause()
    } else {
      handlePlay()
    }
  }, [handlePlay, handlePause])

  const handlePrev = useCallback(() => {
    if (sortedTracks.length === 0) return
    const idx = currentIndex <= 0 ? sortedTracks.length - 1 : currentIndex - 1
    handlePlay(sortedTracks[idx])
  }, [sortedTracks, currentIndex, handlePlay])

  const handleNext = useCallback(() => {
    if (sortedTracks.length === 0) return
    const idx = currentIndex >= sortedTracks.length - 1 ? 0 : currentIndex + 1
    handlePlay(sortedTracks[idx])
  }, [sortedTracks, currentIndex, handlePlay])

  const handleVolumeChange = useCallback((vol: number) => {
    setVolume(vol)
  }, [setVolume])

  // Seek bar handlers
  const handleSeekMouseDown = () => setSeeking(true)
  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    seekRef.current = Number(e.target.value)
    setPosition(seekRef.current)
  }
  const handleSeekMouseUp = () => {
    setSeeking(false)
    seekTrack(seekRef.current)
  }

  const progressPercent = hasProgress ? (position / duration) * 100 : 0

  return (
    <div className="h-11 shrink-0 border-b border-white/5 bg-surface-900/50 backdrop-blur-sm flex items-center px-4 gap-3">
      {/* Left: track icon + name */}
      <div className="flex items-center gap-2 min-w-0 w-40 shrink-0">
        <span className="text-sm shrink-0">
          {builtinInfo?.icon ?? (currentTrack?.category === 'music' ? '🎵' : '🌧')}
        </span>
        <span className="text-sm text-white/70 truncate">
          {tracksReady ? (currentTrack ? currentTrack.name : '未播放') : '加载中...'}
        </span>
        {isPlaying && currentTrack && (
          <span className="flex gap-0.5 items-end h-3 shrink-0 ml-0.5">
            <span className="w-0.5 bg-primary-400 rounded-full animate-bounce" style={{ height: '60%', animationDelay: '0ms' }} />
            <span className="w-0.5 bg-primary-400 rounded-full animate-bounce" style={{ height: '100%', animationDelay: '150ms' }} />
            <span className="w-0.5 bg-primary-400 rounded-full animate-bounce" style={{ height: '40%', animationDelay: '300ms' }} />
            <span className="w-0.5 bg-primary-400 rounded-full animate-bounce" style={{ height: '80%', animationDelay: '450ms' }} />
          </span>
        )}
      </div>

      {/* Prev / PlayPause / Next */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full text-xs
            text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          onClick={handlePrev}
          title="上一首"
        >
          ⏮
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full text-sm
            bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all"
          onClick={handleToggle}
          title={isPlaying ? '暂停' : '播放'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button
          className="w-7 h-7 flex items-center justify-center rounded-full text-xs
            text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          onClick={handleNext}
          title="下一首"
        >
          ⏭
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex-1 flex items-center gap-2 min-w-0">
        <span className="text-[10px] text-white/30 w-8 text-right shrink-0 tabular-nums">
          {hasProgress ? formatDuration(position) : '--:--'}
        </span>
        <div className="flex-1 relative">
          {/* Background */}
          <div className="absolute inset-0 flex items-center">
            <div className="w-full h-1 rounded-full bg-white/10" />
          </div>
          {/* Fill */}
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div
              className="h-1 rounded-full bg-gradient-to-r from-primary-400 to-purple-400"
              style={{ width: `${hasProgress ? progressPercent : (isPlaying ? 100 : 0)}%` }}
            />
          </div>
          {/* Animated shimmer for built-in tracks (indeterminate) */}
          {isPlaying && !hasProgress && (
            <div className="absolute inset-0 flex items-center pointer-events-none overflow-hidden">
              <div
                className="h-1 rounded-full bg-gradient-to-r from-transparent via-primary-400/40 to-transparent w-1/3 animate-shimmer"
              />
            </div>
          )}
          {/* Range input (only for user tracks with duration) */}
          <input
            type="range"
            min={0}
            max={duration || 1}
            step={0.1}
            value={position}
            onChange={handleSeekChange}
            onMouseDown={handleSeekMouseDown}
            onMouseUp={handleSeekMouseUp}
            disabled={!hasProgress}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer
              [&:not(:disabled)]:cursor-pointer disabled:cursor-default"
          />
        </div>
        <span className="text-[10px] text-white/30 w-8 shrink-0 tabular-nums">
          {hasProgress ? formatDuration(duration) : '--:--'}
        </span>
      </div>

      {/* Volume control */}
      <div className="flex items-center gap-1.5 shrink-0">
        <span className="text-xs text-white/30">🔊</span>
        <input
          type="range"
          min={0}
          max={100}
          value={masterVolume}
          onChange={(e) => handleVolumeChange(Number(e.target.value))}
          className="w-20 h-1 rounded-full appearance-none bg-white/10 cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-400 [&::-webkit-slider-thumb]:cursor-pointer"
        />
        <span className="text-[10px] text-white/30 w-7 text-right">{masterVolume}%</span>
      </div>
    </div>
  )
}
