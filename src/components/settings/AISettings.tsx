import { useSettingsStore } from '../../stores/settingsStore'
import type { AIProvider } from '../../types'
import { DEFAULT_OLLAMA_ENDPOINT, DEFAULT_OLLAMA_MODEL, DEFAULT_OPENAI_MODEL } from '../../utils/constants'

export function AISettings() {
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)

  if (!settings) return null

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold flex items-center gap-2">
        AI 设置
        <span className="text-xs bg-primary-500/20 text-primary-400 px-2 py-0.5 rounded-full">Phase 2</span>
      </h3>

      {/* Provider selector */}
      <div>
        <label className="text-sm text-white/60 mb-3 block">AI 后端</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { key: null, label: '关闭', desc: '不使用AI', icon: '✕' },
            { key: 'ollama', label: 'Ollama', desc: '本地免费', icon: '🦙' },
            { key: 'openai', label: 'OpenAI', desc: '云端API', icon: '🤖' },
          ] as { key: AIProvider; label: string; desc: string; icon: string }[]).map((opt) => (
            <button
              key={String(opt.key)}
              className={`p-3 rounded-xl text-center border transition-all
                ${settings.aiProvider === opt.key
                  ? 'border-primary-500/50 bg-primary-500/10 text-primary-400'
                  : 'border-white/10 text-white/40 hover:border-white/20'
                }`}
              onClick={() => update({ aiProvider: opt.key })}
            >
              <div className="text-xl mb-1">{opt.icon}</div>
              <div className="text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-white/20">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Ollama settings */}
      {settings.aiProvider === 'ollama' && (
        <div className="space-y-4 p-4 rounded-xl bg-white/5">
          <div className="text-xs text-white/50 leading-relaxed mb-3">
            <p className="font-medium text-white/70 mb-1">📋 使用步骤：</p>
            <p>1. 安装 <a href="https://ollama.com" target="_blank" className="text-primary-400 underline">Ollama</a> 并启动</p>
            <p>2. 终端运行：<code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">ollama pull {settings.ollamaModel || DEFAULT_OLLAMA_MODEL}</code></p>
            <p>3. 开发模式下使用代理地址即可（已自动配置）</p>
            <p>4. 生产模式需设置环境变量：<code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">set OLLAMA_ORIGINS=*</code> 后重启 Ollama，再将地址改为 <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs">http://localhost:11434</code></p>
          </div>
          <div>
            <label className="text-sm text-white/60 mb-2 block">Ollama 地址</label>
            <input
              type="text"
              className="glass-input w-full font-mono text-sm"
              value={settings.ollamaEndpoint}
              placeholder={DEFAULT_OLLAMA_ENDPOINT}
              onChange={(e) => update({ ollamaEndpoint: e.target.value })}
            />
            <p className="text-xs text-white/20 mt-1">
              开发环境默认使用 Vite 代理（免 CORS），生产环境需直连并配置 CORS
            </p>
          </div>
          <div>
            <label className="text-sm text-white/60 mb-2 block">模型名称</label>
            <input
              type="text"
              className="glass-input w-full"
              value={settings.ollamaModel}
              placeholder={DEFAULT_OLLAMA_MODEL}
              onChange={(e) => update({ ollamaModel: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* OpenAI settings */}
      {settings.aiProvider === 'openai' && (
        <div className="space-y-4 p-4 rounded-xl bg-white/5">
          <div>
            <label className="text-sm text-white/60 mb-2 block">API Key</label>
            <input
              type="password"
              className="glass-input w-full font-mono text-sm"
              value={settings.openaiApiKey}
              placeholder="sk-..."
              onChange={(e) => update({ openaiApiKey: e.target.value })}
            />
            <p className="text-xs text-white/20 mt-1">
              API Key 仅存储在您本地浏览器中，不会上传到任何服务器
            </p>
          </div>
          <div>
            <label className="text-sm text-white/60 mb-2 block">API Endpoint（可选）</label>
            <input
              type="text"
              className="glass-input w-full font-mono text-sm"
              value={settings.openaiEndpoint}
              placeholder="https://api.openai.com/v1"
              onChange={(e) => update({ openaiEndpoint: e.target.value })}
            />
            <p className="text-xs text-white/20 mt-1">
              可填写兼容 OpenAI 格式的其他 API（DeepSeek、通义千问等）
            </p>
          </div>
          <div>
            <label className="text-sm text-white/60 mb-2 block">模型名称</label>
            <input
              type="text"
              className="glass-input w-full"
              value={settings.openaiModel}
              placeholder={DEFAULT_OPENAI_MODEL}
              onChange={(e) => update({ openaiModel: e.target.value })}
            />
          </div>
        </div>
      )}
    </div>
  )
}
