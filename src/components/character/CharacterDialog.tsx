import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../../stores/settingsStore'
import { sendChatMessage } from '../../services/ai'
import { getPersona } from '../../services/ai/personas'
import { speak, stopSpeaking } from '../../services/ttsService'
import { useUIStore } from '../../stores/uiStore'
import { db } from '../../db'
import type { ChatMessage } from '../../db'
import type { Subject } from '../../types'

interface CharacterDialogProps {
  isOpen: boolean
  onToggle: () => void
  subject: Subject | null
}

export function CharacterDialog({ isOpen, onToggle, subject }: CharacterDialogProps) {
  const settings = useSettingsStore((s) => s.settings)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const ttsMuted = useUIStore((s) => s.ttsMuted)
  const toggleTtsMute = useUIStore((s) => s.toggleTtsMute)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load chat history when subject changes
  const loadHistory = useCallback(async () => {
    if (!subject?.id) {
      setMessages([])
      return
    }
    const history = await db.chatMessages
      .where('subjectId')
      .equals(subject.id)
      .sortBy('timestamp')
    setMessages(history)
  }, [subject?.id])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Focus input when panel opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [isOpen])

  const handleSend = async () => {
    if (!input.trim() || !subject?.id || !settings) return

    if (!canChat) {
      const errMsg: ChatMessage = {
        subjectId: subject.id,
        role: 'assistant',
        content: '⚠️ 请先在设置页面选择并配置 AI 后端（Ollama 或 OpenAI）。',
        timestamp: Date.now(),
      }
      await db.chatMessages.add(errMsg)
      setMessages((prev) => [...prev, errMsg])
      setInput('')
      return
    }

    const userMsg: ChatMessage = {
      subjectId: subject.id,
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    }
    await db.chatMessages.add(userMsg)
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const persona = getPersona(subject.name)
      const response = await sendChatMessage(settings, {
        messages: [
          { role: 'system', content: persona.systemPrompt },
          ...messages.map((m) => ({
            role: m.role as 'user' | 'assistant',
            content: m.content,
          })),
          { role: 'user', content: userMsg.content },
        ],
      })

      const assistantMsg: ChatMessage = {
        subjectId: subject.id,
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      }
      await db.chatMessages.add(assistantMsg)
      setMessages((prev) => [...prev, assistantMsg])

      // Speak the response aloud with user TTS settings
      if (!ttsMuted) {
        const s = useSettingsStore.getState().settings
        speak(response, {
          provider: s?.ttsProvider ?? 'browser',
          voiceName: s?.ttsVoiceName || undefined,
          rate: s?.ttsRate ?? 1.0,
          pitch: s?.ttsPitch ?? 1.0,
          volume: (s?.ttsVolume ?? 90) / 100,
        })
      }
    } catch (err) {
      const errMsg: ChatMessage = {
        subjectId: subject.id,
        role: 'assistant',
        content: `❌ 请求失败：${err instanceof Error ? err.message : '未知错误'}`,
        timestamp: Date.now(),
      }
      await db.chatMessages.add(errMsg)
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleClearHistory = async () => {
    if (!subject?.id) return
    stopSpeaking()
    await db.chatMessages.where('subjectId').equals(subject.id).delete()
    const persona = getPersona(subject.name)
    const greeting: ChatMessage = {
      subjectId: subject.id,
      role: 'assistant',
      content: persona.greetingMessage,
      timestamp: Date.now(),
    }
    await db.chatMessages.add(greeting)
    setMessages([greeting])
  }

  const persona = subject ? getPersona(subject.name) : null
  const provider = settings?.aiProvider
  const canChat = provider === 'ollama' || (provider === 'openai' && !!settings?.openaiApiKey)

  return (
    <div className="border-t border-white/10 flex flex-col shrink-0">
      {/* Toggle bar */}
      <button
        className="flex items-center justify-between px-5 py-2.5 hover:bg-white/[0.02] transition-colors text-left"
        onClick={onToggle}
      >
        {subject ? (
          <div className="flex items-center gap-3">
            {subject.spriteData.default ? (
              <img
                src={subject.spriteData.default}
                alt=""
                className="w-7 h-7 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs"
                style={{ backgroundColor: subject.color + '30' }}
              >
                📖
              </div>
            )}
            <div>
              <span className="text-sm font-medium">{persona?.name}</span>
              <span className="text-[10px] text-white/30 ml-2">{persona?.speakingStyle}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-xs">
              💬
            </div>
            <span className="text-sm text-white/40">选择一个科目开始对话</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <span className="text-[10px] text-white/20">{messages.length} 条消息</span>
          )}
          <span className={`text-sm transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </div>
      </button>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 320, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden flex flex-col"
          >
            {/* Messages */}
            <div className="flex-1 overflow-auto px-5 py-3 space-y-3">
              {!subject ? (
                <div className="text-center py-8 text-white/20 text-sm">
                  <p>💬 请先在左侧选择一个科目</p>
                  <p className="text-xs mt-1">不同科目有不同角色的 AI 陪伴</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-white/20 text-sm">
                  <p>💬 开始和 {persona?.name} 对话吧</p>
                  <p className="text-xs mt-1">{persona?.speakingStyle}</p>
                </div>
              ) : null}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-relaxed
                      ${msg.role === 'user'
                        ? 'bg-primary-600/70 text-white rounded-br-md'
                        : 'bg-white/8 text-white/85 rounded-bl-md'
                      }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white/8 px-4 py-2.5 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input bar */}
            <div className="px-4 py-3 border-t border-white/5 shrink-0 flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                className="glass-input flex-1 text-sm py-2"
                placeholder={
                  !subject ? '请先选择科目' :
                  !canChat ? '请先在设置中选择 AI 后端' :
                  '和角色说点什么...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={loading || !canChat || !subject}
              />
              <motion.button
                whileTap={{ scale: 0.9 }}
                className="btn-primary px-4 py-2 text-sm rounded-xl shrink-0"
                onClick={handleSend}
                disabled={loading || !input.trim() || !canChat || !subject}
              >
                {loading ? '...' : '发送'}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                className={`shrink-0 px-2 py-2 text-sm rounded-xl transition-colors
                  ${ttsMuted ? 'bg-white/5 text-white/20' : 'bg-primary-600/20 text-primary-400'}`}
                onClick={() => { toggleTtsMute(); if (!ttsMuted) stopSpeaking() }}
                title={ttsMuted ? '已静音' : '朗读中'}
              >
                {ttsMuted ? '🔇' : '🔊'}
              </motion.button>
              {messages.length > 1 && (
                <button
                  className="btn-ghost text-xs px-2 py-2 shrink-0 text-white/30 hover:text-red-400"
                  onClick={handleClearHistory}
                  title="清除聊天记录"
                >
                  🗑
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
