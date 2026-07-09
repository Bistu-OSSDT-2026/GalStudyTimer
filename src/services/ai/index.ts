/**
 * AI Service — Unified interface for Ollama and OpenAI backends.
 * Phase 2 implementation. Stubs ready for when AI is enabled.
 */

import type { AppSettings } from '../../types'

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  messages: ChatMessage[]
  stream?: boolean
  onToken?: (token: string) => void
}

export async function sendChatMessage(
  settings: AppSettings,
  options: ChatOptions,
): Promise<string> {
  if (settings.aiProvider === 'ollama') {
    return sendOllamaChat(settings, options)
  } else if (settings.aiProvider === 'openai') {
    return sendOpenAIChat(settings, options)
  }
  throw new Error('AI provider not configured')
}

async function sendOllamaChat(
  settings: AppSettings,
  options: ChatOptions,
): Promise<string> {
  const base = settings.ollamaEndpoint || '/api/ollama'
  // Proxy path (starts with /) → append /chat; full URL → append /api/chat
  const url = base.startsWith('http')
    ? `${base}/api/chat`
    : `${base}/chat`
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: settings.ollamaModel || 'llama3',
      messages: options.messages,
      stream: false,
    }),
  })

  if (!resp.ok) {
    throw new Error(`Ollama API error: ${resp.status}`)
  }

  const data = await resp.json()
  return data.message?.content ?? ''
}

async function sendOpenAIChat(
  settings: AppSettings,
  options: ChatOptions,
): Promise<string> {
  const endpoint = settings.openaiEndpoint || 'https://api.openai.com/v1'
  const resp = await fetch(`${endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: settings.openaiModel || 'gpt-4o-mini',
      messages: options.messages,
      stream: false,
    }),
  })

  if (!resp.ok) {
    throw new Error(`OpenAI API error: ${resp.status}`)
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content ?? ''
}

/**
 * Generate a quiz question for a subject.
 * Phase 2 implementation.
 */
export async function generateQuizQuestion(
  settings: AppSettings,
  subjectName: string,
  topic: string,
): Promise<{ question: string; answer: string }> {
  const systemPrompt = `你是一位${subjectName}老师。请出一道关于${topic}的题目，难度适中。
你的回复必须是JSON格式：{"question": "题目内容", "answer": "正确答案"}`

  const response = await sendChatMessage(settings, {
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: '请出一道题目' },
    ],
  })

  try {
    return JSON.parse(response)
  } catch {
    return { question: response, answer: '（请自行判断答案）' }
  }
}
