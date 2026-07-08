// ============================================================
// TTS Service — supports Browser & Edge TTS engines
// ============================================================

import { speakEdgeTts } from './edgeTtsService'

export type TTSProvider = 'browser' | 'edge'

export interface TTSOptions {
  provider?: TTSProvider   // default: 'browser'
  voiceName?: string       // browser: voice name; edge: ShortName like 'zh-CN-XiaoxiaoNeural'
  rate?: number            // 0.5-2.0
  pitch?: number           // 0.5-2.0
  volume?: number          // 0-1
}

let currentUtterance: SpeechSynthesisUtterance | null = null
let currentEdgeStop: (() => void) | null = null

// ---- Browser voices ----

export function getChineseVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices().filter((v) => v.lang.startsWith('zh'))
}

export function getAllVoices(): SpeechSynthesisVoice[] {
  return speechSynthesis.getVoices()
}

function findVoice(name: string): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices()
  if (!name) return null
  return voices.find((v) => v.name === name) ?? voices.find((v) => v.name.includes(name)) ?? null
}

function pickBestVoice(): SpeechSynthesisVoice | null {
  const zh = getChineseVoices()
  if (zh.length === 0) return null
  const preferred = zh.find((v) =>
    v.name.includes('Huihui') || v.name.includes('Xiaoxiao') ||
    v.name.includes('Yaoyao') || v.name.includes('Kangkang')
  )
  return preferred ?? zh[0]
}

// ---- Unified speak API ----

/**
 * Speak text aloud using the configured TTS provider.
 * If already speaking, replaces the current utterance.
 */
export async function speak(text: string, opts?: TTSOptions): Promise<void> {
  stopSpeaking()

  const provider = opts?.provider ?? 'browser'

  if (provider === 'edge') {
    const voiceName = opts?.voiceName || 'zh-CN-XiaoxiaoNeural'
    try {
      const { stop } = await speakEdgeTts(
        text, voiceName,
        opts?.rate ?? 1.0,
        opts?.pitch ?? 1.0,
        opts?.volume ?? 0.9,
      )
      currentEdgeStop = stop
    } catch (err) {
      console.warn('[TTS] Edge TTS failed, falling back to browser:', err)
      // Fallback to browser
      speakBrowser(text, opts)
    }
    return
  }

  speakBrowser(text, opts)
}

function speakBrowser(text: string, opts?: TTSOptions): void {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.rate = opts?.rate ?? 1.0
  utterance.pitch = opts?.pitch ?? 1.0
  utterance.volume = opts?.volume ?? 0.9

  const voice = opts?.voiceName ? findVoice(opts.voiceName) : pickBestVoice()
  if (voice) utterance.voice = voice

  utterance.onerror = (e) => {
    if (e.error !== 'interrupted' && e.error !== 'canceled') {
      console.warn('[TTS] Browser speak error:', e.error)
    }
  }

  currentUtterance = utterance
  speechSynthesis.speak(utterance)
}

/** Stop any ongoing speech */
export function stopSpeaking(): void {
  speechSynthesis.cancel()
  currentUtterance = null
  if (currentEdgeStop) {
    currentEdgeStop()
    currentEdgeStop = null
  }
}

/** Check if currently speaking */
export function isSpeaking(): boolean {
  return speechSynthesis.speaking
}

/** Ensure browser voices are loaded */
export function ensureVoicesLoaded(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const voices = speechSynthesis.getVoices()
    if (voices.length > 0) {
      resolve(voices)
    } else {
      speechSynthesis.onvoiceschanged = () => resolve(speechSynthesis.getVoices())
    }
  })
}


