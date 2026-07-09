// ============================================================
// Edge TTS — Microsoft Edge Read Aloud API (free, no key)
// ============================================================

const TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const BASE = 'https://speech.platform.bing.com/consumer/speech/synthesize/readaloud'

export interface EdgeVoice {
  Name: string
  ShortName: string
  Gender: string
  Locale: string
  LocalName: string
  VoiceType: string
}

let cachedVoices: EdgeVoice[] = []

/** Fetch available Edge neural voices */
export async function fetchEdgeVoices(): Promise<EdgeVoice[]> {
  if (cachedVoices.length > 0) return cachedVoices
  const res = await fetch(`${BASE}/voices/list?trustedclienttoken=${TOKEN}`, {
    headers: { 'Accept': 'application/json' },
  })
  if (!res.ok) throw new Error(`Edge TTS voice list failed: ${res.status}`)
  cachedVoices = await res.json()
  return cachedVoices
}

/** Filter Chinese voices from Edge */
export function getEdgeChineseVoices(voices: EdgeVoice[]): EdgeVoice[] {
  return voices.filter((v) => v.Locale.startsWith('zh'))
}

/**
 * Synthesize text to speech using Edge TTS.
 * Returns an ArrayBuffer of MP3 audio data.
 */
export async function synthesizeEdgeTts(
  text: string,
  voiceShortName = 'zh-CN-XiaoxiaoNeural',
  rate = 1.0,
  pitch = 1.0,
): Promise<ArrayBuffer> {
  // Build SSML
  const ratePercent = Math.round((rate - 1) * 100)
  const pitchPercent = Math.round((pitch - 1) * 50)
  const ssml = `
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="zh-CN">
  <voice name="${voiceShortName}">
    <prosody rate="${ratePercent >= 0 ? '+' : ''}${ratePercent}%" pitch="${pitchPercent >= 0 ? '+' : ''}${pitchPercent}%">
      ${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </prosody>
  </voice>
</speak>`.trim()

  const res = await fetch(`${BASE}/edge/v1?TrustedClientToken=${TOKEN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/ssml+xml',
      'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
      'User-Agent': 'Edge/127.0',
    },
    body: ssml,
  })

  if (!res.ok) throw new Error(`Edge TTS synthesis failed: ${res.status}`)
  return res.arrayBuffer()
}

/**
 * Speak text using Edge TTS. Returns a cleanup function.
 */
export async function speakEdgeTts(
  text: string,
  voiceShortName = 'zh-CN-XiaoxiaoNeural',
  rate = 1.0,
  pitch = 1.0,
  volume = 0.9,
): Promise<{ stop: () => void }> {
  const audioData = await synthesizeEdgeTts(text, voiceShortName, rate, pitch)
  const blob = new Blob([audioData], { type: 'audio/mpeg' })
  const url = URL.createObjectURL(blob)

  const audio = new Audio(url)
  audio.volume = volume
  await audio.play()

  // Cleanup when done
  audio.onended = () => URL.revokeObjectURL(url)
  audio.onerror = () => URL.revokeObjectURL(url)

  return {
    stop: () => {
      audio.pause()
      audio.currentTime = 0
      URL.revokeObjectURL(url)
    },
  }
}
