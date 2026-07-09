import { create } from 'zustand'
import type { AudioTrack, AudioCategory } from '../types'

interface AudioStore {
  tracks: AudioTrack[]
  currentTrackId: number | null
  isPlaying: boolean
  masterVolume: number
  autoPlayOnStart: boolean
  autoMuteOnEnd: boolean
  category: AudioCategory | null

  // Actions
  setTracks: (tracks: AudioTrack[]) => void
  addTrack: (track: AudioTrack) => void
  removeTrack: (id: number) => void
  play: (trackId?: number) => void
  pause: () => void
  togglePlay: () => void
  setVolume: (volume: number) => void
  setCategory: (category: AudioCategory | null) => void
}

export const useAudioStore = create<AudioStore>((set) => ({
  tracks: [],
  currentTrackId: null,
  isPlaying: false,
  masterVolume: 70,
  autoPlayOnStart: true,
  autoMuteOnEnd: false,
  category: null,

  setTracks: (tracks) => set({ tracks }),
  addTrack: (track) => set((state) => ({ tracks: [...state.tracks, track] })),
  removeTrack: (id) => set((state) => ({
    tracks: state.tracks.filter((t) => t.id !== id),
    currentTrackId: state.currentTrackId === id ? null : state.currentTrackId,
  })),
  play: (trackId) => set((state) => ({
    currentTrackId: trackId ?? state.currentTrackId,
    isPlaying: true,
  })),
  pause: () => set({ isPlaying: false }),
  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  setVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(100, volume)) }),
  setCategory: (category) => set({ category }),
}))
