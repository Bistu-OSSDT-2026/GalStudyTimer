export type AIProvider = 'ollama' | 'openai' | null

export interface AppSettings {
  id: 'current'
  // Timer
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  // Audio
  autoStartAudio: boolean
  autoMuteOnEnd: boolean
  masterVolume: number        // 0-100
  // AI
  aiProvider: AIProvider
  ollamaEndpoint: string
  ollamaModel: string
  openaiApiKey: string
  openaiEndpoint: string
  openaiModel: string
  // TTS
  ttsProvider: 'browser' | 'edge'  // TTS engine
  ttsVoiceName: string              // browser: voice name; edge: ShortName
  ttsRate: number                   // 0.5-2.0
  ttsPitch: number                  // 0.5-2.0
  ttsVolume: number                 // 0-100
}
