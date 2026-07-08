import { create } from 'zustand'
import type { CompanionMessage } from '../types'
import { ENCOURAGEMENT_MESSAGES } from '../utils/constants'
import { speak } from '../services/ttsService'
import { useSettingsStore } from './settingsStore'

function randomPick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

interface UIStore {
  // Modal
  activeModal: string | null
  modalData: unknown

  // Sidebar
  sidebarOpen: boolean

  // Character message
  currentMessage: CompanionMessage | null
  isMessageVisible: boolean
  lastMessageTime: number

  // Notification
  notificationQueue: Array<{ title: string; body: string }>

  // TTS
  ttsMuted: boolean
  toggleTtsMute: () => void

  // Actions
  openModal: (id: string, data?: unknown) => void
  closeModal: () => void
  toggleSidebar: () => void
  showCharacterMessage: (context: CompanionMessage['context']) => void
  hideCharacterMessage: () => void
  showNotification: (title: string, body: string) => void
  dismissNotification: () => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  activeModal: null,
  modalData: null,
  sidebarOpen: true,
  currentMessage: null,
  isMessageVisible: false,
  lastMessageTime: 0,
  notificationQueue: [],
  ttsMuted: false,
  toggleTtsMute: () => set((s) => ({ ttsMuted: !s.ttsMuted })),

  openModal: (id, data) => set({ activeModal: id, modalData: data }),
  closeModal: () => set({ activeModal: null, modalData: null }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  showCharacterMessage: (context) => {
    const now = Date.now()
    // Cooldown: don't show messages too frequently (encourage: 3min, others: immediate)
    const { lastMessageTime } = get()
    if (context === 'encourage' && now - lastMessageTime < 180000) return

    const messages = ENCOURAGEMENT_MESSAGES[context]
    const text = randomPick(messages)
    set({
      currentMessage: { text, context },
      isMessageVisible: true,
      lastMessageTime: now,
    })

    // Speak the message via TTS with user settings
    if (!get().ttsMuted) {
      const s = useSettingsStore.getState().settings
      speak(text, {
        provider: s?.ttsProvider ?? 'browser',
        voiceName: s?.ttsVoiceName || undefined,
        rate: s?.ttsRate ?? 1.0,
        pitch: s?.ttsPitch ?? 1.0,
        volume: (s?.ttsVolume ?? 90) / 100,
      })
    }

    // Auto-hide after 4 seconds
    setTimeout(() => {
      set((s) => s.isMessageVisible && s.currentMessage?.text === text
        ? { isMessageVisible: false }
        : {}
      )
    }, 4000)
  },

  hideCharacterMessage: () => set({ isMessageVisible: false }),

  showNotification: (title, body) => {
    set((state) => ({
      notificationQueue: [...state.notificationQueue, { title, body }],
    }))
  },

  dismissNotification: () => {
    set((state) => ({
      notificationQueue: state.notificationQueue.slice(1),
    }))
  },
}))
