import { Routes, Route } from 'react-router-dom'
import { MainLayout } from './components/layout/MainLayout'

// Lazy-loaded pages
import { TimerPage } from './components/timer/TimerPage'
import { SubjectPage } from './components/subject/SubjectPage'
import { AudioPage } from './components/audio/AudioPage'
import { LogsPage } from './components/logs/LogsPage'
import { AchievementPage } from './components/logs/AchievementPage'
import { SettingsPage } from './components/settings/SettingsPage'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<TimerPage />} />
        <Route path="/subjects" element={<SubjectPage />} />
        <Route path="/audio" element={<AudioPage />} />
        <Route path="/logs" element={<LogsPage />} />
        <Route path="/achievements" element={<AchievementPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
