import { create } from 'zustand'
import { db } from '../db'
import type { AppSettings } from '../types'
import { DEFAULT_FOCUS_MINUTES, DEFAULT_BREAK_MINUTES, DEFAULT_LONG_BREAK_MINUTES, LONG_BREAK_INTERVAL, DEFAULT_OLLAMA_ENDPOINT, DEFAULT_OLLAMA_MODEL, DEFAULT_OPENAI_MODEL } from '../utils/constants'

interface SettingsStore {
  settings: AppSettings | null
  loaded: boolean

  load: () => Promise<void>
  update: (partial: Partial<AppSettings>) => Promise<void>
  reset: () => Promise<void>
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loaded: false,

  load: async () => {
    const settings = await db.settings.get('current')
    if (settings) {
      set({ settings, loaded: true })
    }
  },

  update: async (partial) => {
    await db.settings.update('current', partial)
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...partial } : null,
    }))
  },

  reset: async () => {
    const defaults: AppSettings = {
      id: 'current',
      focusDuration: DEFAULT_FOCUS_MINUTES,
      shortBreakDuration: DEFAULT_BREAK_MINUTES,
      longBreakDuration: DEFAULT_LONG_BREAK_MINUTES,
      longBreakInterval: LONG_BREAK_INTERVAL,
      autoStartAudio: true,
      autoMuteOnEnd: false,
      masterVolume: 70,
      aiProvider: null,
      ollamaEndpoint: DEFAULT_OLLAMA_ENDPOINT,
      ollamaModel: DEFAULT_OLLAMA_MODEL,
      openaiApiKey: '',
      openaiEndpoint: 'https://api.openai.com/v1',
      openaiModel: DEFAULT_OPENAI_MODEL,
    }
    await db.settings.put(defaults)
    set({ settings: defaults })
  },
}))
