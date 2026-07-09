import { useEffect, useState, useCallback } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import type { TTSProvider } from '../../services/ttsService'

export function TTSSettings() {
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)

  const [browserVoices, setBrowserVoices] = useState<SpeechSynthesisVoice[]>([])
  const [edgeVoices, setEdgeVoices] = useState<{ ShortName: string; LocalName: string; Gender: string; Locale: string }[]>([])
  const [edgeLoading, setEdgeLoading] = useState(false)
  const [edgeError, setEdgeError] = useState('')
  const [testText, setTestText] = useState('你好，我是你的学习伙伴，一起加油吧！')
  const [testing, setTesting] = useState(false)
  const [initError, setInitError] = useState(false)

  // Load browser voices safely
  useEffect(() => {
    let cancelled = false
    try {
      // SpeechSynthesis might not be available
      if (typeof speechSynthesis === 'undefined') {
        setInitError(true)
        return
      }
      const voices = speechSynthesis.getVoices()
      if (voices.length > 0) {
        setBrowserVoices(voices)
        return
      }
      const onVoicesChanged = () => {
        if (!cancelled) setBrowserVoices(speechSynthesis.getVoices())
      }
      speechSynthesis.addEventListener('voiceschanged', onVoicesChanged)
      return () => speechSynthesis.removeEventListener('voiceschanged', onVoicesChanged)
    } catch {
      if (!cancelled) setInitError(true)
    }
    return () => { cancelled = true }
  }, [])

  // Load Edge voices on demand
  const loadEdgeVoices = useCallback(async () => {
    setEdgeLoading(true)
    setEdgeError('')
    try {
      const { fetchEdgeVoices } = await import('../../services/edgeTtsService')
      const voices = await fetchEdgeVoices()
      setEdgeVoices(voices)
    } catch {
      setEdgeError('无法获取 Edge 语音列表，请检查网络连接')
    } finally {
      setEdgeLoading(false)
    }
  }, [])

  const zhBrowserVoices = browserVoices.filter((v) => v.lang?.startsWith('zh'))
  const zhEdgeVoices = edgeVoices.filter((v) => v.Locale?.startsWith('zh'))

  const ttsRate = settings?.ttsRate ?? 1.0
  const ttsPitch = settings?.ttsPitch ?? 1.0
  const ttsVolume = settings?.ttsVolume ?? 90
  const ttsVoiceName = settings?.ttsVoiceName ?? ''
  const provider: TTSProvider = settings?.ttsProvider ?? 'browser'

  const handleTest = useCallback(async () => {
    const s = useSettingsStore.getState().settings
    if (!s) return
    setTesting(true)
    try {
      const { speak, stopSpeaking: stp } = await import('../../services/ttsService')
      await speak(testText, {
        provider: s.ttsProvider ?? 'browser',
        voiceName: s.ttsVoiceName || undefined,
        rate: s.ttsRate ?? 1.0,
        pitch: s.ttsPitch ?? 1.0,
        volume: (s.ttsVolume ?? 90) / 100,
      })
    } catch { /* TTS failure is non-critical */ }
    setTesting(false)
  }, [testText])

  const handleStop = useCallback(async () => {
    try {
      const { stopSpeaking } = await import('../../services/ttsService')
      stopSpeaking()
    } catch { /* ok */ }
  }, [])

  if (!settings || initError) return null

  return (
    <section>
      <h3 className="text-lg font-bold mb-1">🔊 语音朗读 (TTS)</h3>
      <p className="text-white/40 text-sm mb-5">
        浏览器内置语音免费离线，Edge 神经网络语音音质极高，需联网。
      </p>

      <div className="space-y-5">
        {/* Provider toggle */}
        <div>
          <label className="text-sm text-white/60 mb-2 block">语音引擎</label>
          <div className="flex gap-2">
            {([
              { key: 'browser' as TTSProvider, label: '🖥 浏览器内置', desc: '离线免费' },
              { key: 'edge' as TTSProvider, label: '🌐 Edge 神经网络', desc: '高音质·需联网' },
            ]).map((opt) => (
              <button
                key={opt.key}
                className={`flex-1 py-2.5 px-3 rounded-xl text-sm border transition-all
                  ${provider === opt.key
                    ? 'border-primary-500/40 bg-primary-500/10 text-primary-400'
                    : 'border-white/10 bg-white/5 text-white/40 hover:text-white/60'}`}
                onClick={() => {
                  update({ ttsProvider: opt.key })
                  if (opt.key === 'edge' && edgeVoices.length === 0) loadEdgeVoices()
                }}
              >
                <div>{opt.label}</div>
                <div className="text-[10px] opacity-50 mt-0.5">{opt.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Voice selector — browser */}
        {provider === 'browser' && (
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">语音角色</label>
            <select
              className="glass-input w-full"
              value={ttsVoiceName}
              onChange={(e) => update({ ttsVoiceName: e.target.value })}
            >
              <option value="">自动选择（推荐）</option>
              {zhBrowserVoices.map((v) => (
                <option key={v.name} value={v.name}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Voice selector — Edge */}
        {provider === 'edge' && (
          <div>
            <label className="text-sm text-white/60 mb-1.5 block">
              Edge 语音角色
              {edgeLoading && <span className="text-white/30 ml-2">加载中...</span>}
            </label>
            {!edgeLoading && zhEdgeVoices.length === 0 && !edgeError && (
              <button className="btn-ghost text-sm" onClick={loadEdgeVoices}>
                点击加载语音列表
              </button>
            )}
            {edgeError && <p className="text-xs text-red-400">{edgeError}</p>}
            {zhEdgeVoices.length > 0 && (
              <select
                className="glass-input w-full"
                value={ttsVoiceName}
                onChange={(e) => update({ ttsVoiceName: e.target.value })}
              >
                {zhEdgeVoices.map((v) => (
                  <option key={v.ShortName} value={v.ShortName}>
                    {v.LocalName} — {v.Gender === 'Female' ? '女' : '男'}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {/* Rate */}
        <div>
          <label className="text-sm text-white/60 mb-1.5 block">
            语速: {ttsRate.toFixed(1)}x
          </label>
          <input
            type="range" min={0.5} max={2.0} step={0.1}
            value={ttsRate}
            onChange={(e) => update({ ttsRate: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary-400 [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Pitch */}
        <div>
          <label className="text-sm text-white/60 mb-1.5 block">
            音调: {ttsPitch.toFixed(1)}
          </label>
          <input
            type="range" min={0.5} max={2.0} step={0.1}
            value={ttsPitch}
            onChange={(e) => update({ ttsPitch: parseFloat(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary-400 [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Volume */}
        <div>
          <label className="text-sm text-white/60 mb-1.5 block">
            朗读音量: {ttsVolume}%
          </label>
          <input
            type="range" min={0} max={100} step={5}
            value={ttsVolume}
            onChange={(e) => update({ ttsVolume: parseInt(e.target.value) })}
            className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-primary-400 [&::-webkit-slider-thumb]:cursor-pointer"
          />
        </div>

        {/* Test */}
        <div>
          <label className="text-sm text-white/60 mb-1.5 block">测试朗读</label>
          <div className="flex gap-2">
            <input
              type="text" className="glass-input flex-1 text-sm"
              value={testText}
              onChange={(e) => setTestText(e.target.value)}
              placeholder="输入测试文本..."
            />
            <button className="btn-primary text-sm px-4 shrink-0" onClick={handleTest} disabled={testing}>
              {testing ? '...' : '▶ 试听'}
            </button>
            <button className="btn-ghost text-sm px-3 shrink-0" onClick={handleStop}>⏹</button>
          </div>
        </div>
      </div>
    </section>
  )
}
