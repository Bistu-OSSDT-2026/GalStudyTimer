import { useEffect } from 'react'
import { useSettingsStore } from '../../stores/settingsStore'
import { GeneralSettings } from './GeneralSettings'
import { AISettings } from './AISettings'
import { TTSSettings } from './TTSSettings'

export function SettingsPage() {
  const loaded = useSettingsStore((s) => s.loaded)
  const load = useSettingsStore((s) => s.load)

  useEffect(() => {
    if (!loaded) load()
  }, [loaded, load])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">设置</h2>

      <div className="space-y-10">
        <GeneralSettings />

        <hr className="border-white/5" />

        <AISettings />

        <hr className="border-white/5" />

        <TTSSettings />
      </div>
    </div>
  )
}
