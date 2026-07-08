import { useSettingsStore } from '../../stores/settingsStore'
import { FOCUS_DURATION_MIN, FOCUS_DURATION_MAX, BREAK_DURATION_MIN, BREAK_DURATION_MAX } from '../../utils/constants'

export function GeneralSettings() {
  const settings = useSettingsStore((s) => s.settings)
  const update = useSettingsStore((s) => s.update)

  if (!settings) return null

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-bold">通用设置</h3>

      {/* Focus duration */}
      <div>
        <label className="text-sm text-white/60 mb-2 block">
          专注时长: {settings.focusDuration} 分钟
        </label>
        <input
          type="range"
          min={FOCUS_DURATION_MIN}
          max={FOCUS_DURATION_MAX}
          step={5}
          value={settings.focusDuration}
          onChange={(e) => update({ focusDuration: Number(e.target.value) })}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Break duration */}
      <div>
        <label className="text-sm text-white/60 mb-2 block">
          短休息时长: {settings.shortBreakDuration} 分钟
        </label>
        <input
          type="range"
          min={BREAK_DURATION_MIN}
          max={BREAK_DURATION_MAX}
          step={1}
          value={settings.shortBreakDuration}
          onChange={(e) => update({ shortBreakDuration: Number(e.target.value) })}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Long break */}
      <div>
        <label className="text-sm text-white/60 mb-2 block">
          长休息时长: {settings.longBreakDuration} 分钟
        </label>
        <input
          type="range"
          min={5}
          max={60}
          step={5}
          value={settings.longBreakDuration}
          onChange={(e) => update({ longBreakDuration: Number(e.target.value) })}
          className="w-full accent-primary-500"
        />
      </div>

      {/* Auto audio */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm">计时开始自动播放音乐</div>
          <div className="text-xs text-white/30">开始专注时自动播放选中的音频</div>
        </div>
        <button
          className={`w-12 h-6 rounded-full transition-colors ${settings.autoStartAudio ? 'bg-primary-500' : 'bg-white/10'}`}
          onClick={() => update({ autoStartAudio: !settings.autoStartAudio })}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.autoStartAudio ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'}`} />
        </button>
      </div>

      {/* Auto mute on end */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm">计时结束自动静音</div>
          <div className="text-xs text-white/30">计时结束时淡出背景音乐</div>
        </div>
        <button
          className={`w-12 h-6 rounded-full transition-colors ${settings.autoMuteOnEnd ? 'bg-primary-500' : 'bg-white/10'}`}
          onClick={() => update({ autoMuteOnEnd: !settings.autoMuteOnEnd })}
        >
          <div className={`w-5 h-5 rounded-full bg-white transition-transform ${settings.autoMuteOnEnd ? 'translate-x-6 ml-0.5' : 'translate-x-0.5'}`} />
        </button>
      </div>
    </div>
  )
}
