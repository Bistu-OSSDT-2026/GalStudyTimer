import { Howler } from 'howler'

// ============================================================
// Built-in ambient sound generator (Web Audio API)
// ============================================================

type NoiseType = 'rain' | 'cafe' | 'forest' | 'lofi'

interface ActiveGenerator {
  stop: () => void
  setVolume: (v: number) => void
}

const activeGenerators = new Map<string, ActiveGenerator>()

// Singleton AnalyserNode — ALL audio (built-in + user tracks) routes through this
let analyserNode: AnalyserNode | null = null

function ensureAnalyser(ctx: AudioContext): AnalyserNode {
  if (!analyserNode || analyserNode.context !== ctx) {
    // If recreating, preserve existing connections
    analyserNode = ctx.createAnalyser()
    analyserNode.fftSize = 256
    analyserNode.smoothingTimeConstant = 0.65
    analyserNode.connect(ctx.destination)
  }
  return analyserNode
}

/** Get the shared AnalyserNode for visualization */
export function getAnalyserNode(): AnalyserNode | null {
  return analyserNode
}

function generateAmbient(type: NoiseType, volume = 0.3): ActiveGenerator {
  const ctx = Howler.ctx
  if (!ctx || ctx.state === 'closed') throw new Error('AudioContext not available')
  if (ctx.state === 'suspended') ctx.resume()

  const masterGain = ctx.createGain()
  masterGain.gain.value = volume
  masterGain.connect(ensureAnalyser(ctx))

  const nodes: AudioNode[] = [masterGain]

  switch (type) {
    case 'rain': {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.02 * white) / 1.02
        lastOut = data[i]
        data[i] *= 3.5
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 600
      const highpass = ctx.createBiquadFilter()
      highpass.type = 'highpass'
      highpass.frequency.value = 100
      source.connect(lowpass)
      lowpass.connect(highpass)
      highpass.connect(masterGain)
      nodes.push(source, lowpass, highpass)
      source.start()
      break
    }
    case 'cafe': {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.01 * white) / 1.01
        lastOut = data[i]
        data[i] *= 1.5
        if (Math.random() < 0.0003) data[i] += (Math.random() * 2 - 1) * 0.5
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 800
      source.connect(lowpass)
      lowpass.connect(masterGain)
      nodes.push(source, lowpass)
      source.start()
      break
    }
    case 'forest': {
      const bufferSize = 2 * ctx.sampleRate
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      let lastOut = 0
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1
        data[i] = (lastOut + 0.005 * white) / 1.005
        lastOut = data[i]
        data[i] *= 2
      }
      const source = ctx.createBufferSource()
      source.buffer = buffer
      source.loop = true
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 300
      source.connect(lowpass)
      lowpass.connect(masterGain)
      nodes.push(source, lowpass)
      source.start()

      const birdGain = ctx.createGain()
      birdGain.gain.value = 0.03
      birdGain.connect(masterGain)
      nodes.push(birdGain)

      const scheduleChirp = () => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = 2000 + Math.random() * 2000
        osc.connect(birdGain)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.1 + Math.random() * 0.15)
      }
      const chirpInterval = setInterval(() => {
        if (Math.random() < 0.4) scheduleChirp()
      }, 3000)

      const origStop = () => clearInterval(chirpInterval)
      return {
        stop: () => {
          origStop()
          nodes.forEach((n) => {
            try { (n as AudioScheduledSourceNode).stop?.() } catch { /* ok */ }
            try { n.disconnect() } catch { /* ok */ }
          })
          activeGenerators.delete(type)
        },
        setVolume: (v) => { masterGain.gain.value = v },
      }
    }
    case 'lofi': {
      const frequencies = [261.63, 329.63, 392.00]
      frequencies.forEach((freq) => {
        const osc = ctx.createOscillator()
        osc.type = 'sine'
        osc.frequency.value = freq
        const oscGain = ctx.createGain()
        oscGain.gain.value = 0.06
        const lfo = ctx.createOscillator()
        lfo.type = 'sine'
        lfo.frequency.value = 0.3 + Math.random() * 0.5
        const lfoGain = ctx.createGain()
        lfoGain.gain.value = 0.02
        lfo.connect(lfoGain)
        lfoGain.connect(oscGain.gain)
        lfo.start()
        osc.connect(oscGain)
        oscGain.connect(masterGain)
        osc.start()
        nodes.push(osc, oscGain, lfo, lfoGain)
      })
      break
    }
  }

  activeGenerators.set(type, {
    stop: () => {
      nodes.forEach((n) => {
        try { (n as AudioScheduledSourceNode).stop?.() } catch { /* ok */ }
        try { n.disconnect() } catch { /* ok */ }
      })
      activeGenerators.delete(type)
    },
    setVolume: (v) => { masterGain.gain.value = v },
  })

  return activeGenerators.get(type)!
}

// ============================================================
// User-track playback (pure Web Audio — routes through AnalyserNode)
// ============================================================

interface UserTrackState {
  trackId: string
  isPlaying: boolean
  source: AudioBufferSourceNode | null
  gainNode: GainNode | null
  buffer: AudioBuffer | null
  startedAt: number       // ctx.currentTime when playback started
  startOffset: number     // seek offset in seconds
}

// Cache decoded AudioBuffers by blobKey to avoid re-decoding
const bufferCache = new Map<string, AudioBuffer>()
const userTracks = new Map<string, UserTrackState>()

function getUserKey(trackId: number): string {
  return `user:${trackId}`
}

async function decodeBuffer(ctx: AudioContext, blob: Blob, blobKey: string): Promise<AudioBuffer> {
  if (bufferCache.has(blobKey)) return bufferCache.get(blobKey)!
  const arrayBuf = await blob.arrayBuffer()
  const audioBuf = await ctx.decodeAudioData(arrayBuf)
  bufferCache.set(blobKey, audioBuf)
  return audioBuf
}

/**
 * Play a user-uploaded audio file through Web Audio (routed through AnalyserNode).
 */
export async function playUserTrack(trackId: number, blob: Blob, volume = 0.7): Promise<void> {
  stopAllUserTracks()

  const ctx = Howler.ctx
  if (!ctx || ctx.state === 'closed') throw new Error('AudioContext not available')
  if (ctx.state === 'suspended') ctx.resume()

  const analyser = ensureAnalyser(ctx)
  const buffer = await decodeBuffer(ctx, blob, `audio_${trackId}`)

  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.loop = true

  const gainNode = ctx.createGain()
  gainNode.gain.value = Math.max(0, Math.min(1, volume))

  source.connect(gainNode)
  gainNode.connect(analyser)

  source.start(0)

  const key = getUserKey(trackId)
  userTracks.set(key, {
    trackId: key,
    isPlaying: true,
    source,
    gainNode,
    buffer,
    startedAt: ctx.currentTime,
    startOffset: 0,
  })
}

function stopUserTrack(state: UserTrackState): void {
  try { state.source?.stop() } catch { /* already stopped */ }
  try { state.source?.disconnect() } catch { /* ok */ }
  try { state.gainNode?.disconnect() } catch { /* ok */ }
}

// ============================================================
// High-level audio player API
// ============================================================

interface PlayerState {
  trackId: string
  isPlaying: boolean
  controller: ActiveGenerator | null
}

const players = new Map<string, PlayerState>()

function getPlayerKey(trackId: string): string {
  return `player:${trackId}`
}

export function playBuiltIn(type: NoiseType, volume = 0.3): void {
  stopAllBuiltIn()
  const controller = generateAmbient(type, volume)
  const key = getPlayerKey(`builtin:${type}`)
  players.set(key, { trackId: `builtin:${type}`, isPlaying: true, controller })
}

export function stopAllBuiltIn(): void {
  activeGenerators.forEach((gen) => gen.stop())
  activeGenerators.clear()
  players.forEach((state, key) => {
    if (key.startsWith('player:builtin:')) {
      state.controller?.stop()
      players.delete(key)
    }
  })
}

export function stopAllUserTracks(): void {
  userTracks.forEach((state) => stopUserTrack(state))
  userTracks.clear()
}

export function stopAll(): void {
  stopAllBuiltIn()
  stopAllUserTracks()
}

export function isTrackPlaying(trackKey: string): boolean {
  const key = getPlayerKey(trackKey)
  if (players.get(key)?.isPlaying) return true
  // Also check user tracks
  for (const state of userTracks.values()) {
    if (state.trackId === trackKey && state.isPlaying) return true
  }
  return false
}

/**
 * Get current position/duration of the active user track.
 * Built-in (generated) tracks have no duration — returns null.
 */
export function getTrackPosition(): { position: number; duration: number } | null {
  for (const state of userTracks.values()) {
    if (state.isPlaying && state.buffer) {
      const ctx = Howler.ctx
      if (!ctx) return null
      const elapsed = ctx.currentTime - state.startedAt + state.startOffset
      const dur = state.buffer.duration
      return { position: elapsed % dur, duration: dur }
    }
  }
  return null
}

/**
 * Seek the active user track.
 */
export function seekTrack(position: number): void {
  for (const [key, state] of userTracks.entries()) {
    if (state.isPlaying && state.buffer) {
      const ctx = Howler.ctx
      if (!ctx) return
      const dur = state.buffer.duration
      const clamped = Math.max(0, Math.min(dur, position))

      // Stop current source and create a new one at the seeked position
      try { state.source?.stop() } catch { /* ok */ }
      try { state.source?.disconnect() } catch { /* ok */ }

      const newSource = ctx.createBufferSource()
      newSource.buffer = state.buffer
      newSource.loop = true
      newSource.connect(state.gainNode!)
      newSource.start(0, clamped)

      state.source = newSource
      state.startedAt = ctx.currentTime
      state.startOffset = clamped
      return
    }
  }
}

export function setMasterVolume(volume: number): void {
  const v = Math.max(0, Math.min(1, volume / 100))
  activeGenerators.forEach((gen) => gen.setVolume(v))
  userTracks.forEach((state) => {
    if (state.gainNode) state.gainNode.gain.value = v
  })
  Howler.volume(v)
}

export function resumeAudioContext(): void {
  if (Howler.ctx && Howler.ctx.state === 'suspended') {
    Howler.ctx.resume()
  }
}

export function playNotificationSound(volume = 0.5): void {
  try {
    const ctx = Howler.ctx
    if (!ctx) return
    if (ctx.state === 'suspended') ctx.resume()
    const gain = ctx.createGain()
    gain.connect(analyserNode ?? ctx.destination)
    gain.gain.value = volume
    const now = ctx.currentTime
    ;[523, 659, 784].forEach((freq, i) => {
      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = freq
      osc.connect(gain)
      osc.start(now + i * 0.15)
      osc.stop(now + i * 0.15 + 0.2)
    })
    gain.gain.setValueAtTime(volume, now)
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.7)
  } catch { /* silently fail */ }
}
