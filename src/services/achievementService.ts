import { db } from '../db'
import { ACHIEVEMENT_IDS } from '../utils/constants'
import type { Achievement } from '../types'

interface AchievementChecker {
  id: string
  check: () => Promise<{ unlocked: boolean; progress: number }>
}

/**
 * Check all achievements and unlock any that meet their criteria.
 * Returns the list of newly unlocked achievements.
 */
export async function checkAndUnlockAchievements(): Promise<Achievement[]> {
  const newlyUnlocked: Achievement[] = []

  try {
    // Get all existing achievements (or seed if empty)
    let achievements = await db.achievements.toArray()
    if (achievements.length === 0) {
      // If achievements are somehow empty, skip for now — seedIfEmpty handles initial seeding
      return newlyUnlocked
    }

    // Collect stats
    const allLogs = await db.studyLogs.toArray()
    const focusLogs = allLogs.filter((l) => l.type === 'focus')
    const totalFocusSessions = focusLogs.length
    const totalFocusSeconds = focusLogs.reduce((sum, l) => sum + l.duration, 0)
    const totalFocusMinutes = Math.round(totalFocusSeconds / 60)

    // Unique subjects studied (focus logs)
    const studiedSubjectIds = new Set(focusLogs.map((l) => l.subjectId))
    // Only count non-archived subjects
    const activeSubjects = await db.subjects.filter((s) => !s.isArchived).toArray()
    const activeSubjectCount = activeSubjects.length

    // Streak calculation
    const streakDays = calculateStreak(focusLogs)

    // Current hour for early_bird / night_owl
    const currentHour = new Date().getHours()

    // Latest focus log for time-based checks
    const latestFocusLog = focusLogs.length > 0
      ? focusLogs.reduce((latest, l) => (l.startTime > latest.startTime ? l : latest), focusLogs[0])
      : null
    const latestFocusHour = latestFocusLog ? new Date(latestFocusLog.startTime).getHours() : null

    for (const ach of achievements) {
      // Skip already unlocked
      if (ach.unlockedAt !== null) continue

      let unlocked = false
      let progress = ach.progress

      switch (ach.id) {
        case ACHIEVEMENT_IDS.FIRST_FOCUS:
          progress = totalFocusSessions >= 1 ? 100 : 0
          unlocked = totalFocusSessions >= 1
          break

        case ACHIEVEMENT_IDS.FOCUS_10:
          progress = Math.min(100, (totalFocusSessions / 10) * 100)
          unlocked = totalFocusSessions >= 10
          break

        case ACHIEVEMENT_IDS.FOCUS_100:
          progress = Math.min(100, (totalFocusSessions / 100) * 100)
          unlocked = totalFocusSessions >= 100
          break

        case ACHIEVEMENT_IDS.HOUR_1:
          progress = Math.min(100, (totalFocusMinutes / 60) * 100)
          unlocked = totalFocusMinutes >= 60
          break

        case ACHIEVEMENT_IDS.HOUR_10:
          progress = Math.min(100, (totalFocusMinutes / 600) * 100)
          unlocked = totalFocusMinutes >= 600
          break

        case ACHIEVEMENT_IDS.HOUR_100:
          progress = Math.min(100, (totalFocusMinutes / 6000) * 100)
          unlocked = totalFocusMinutes >= 6000
          break

        case ACHIEVEMENT_IDS.ALL_SUBJECTS:
          progress = activeSubjectCount > 0
            ? Math.min(100, (studiedSubjectIds.size / activeSubjectCount) * 100)
            : 0
          unlocked = activeSubjectCount > 0 && studiedSubjectIds.size >= activeSubjectCount
          break

        case ACHIEVEMENT_IDS.EARLY_BIRD:
          progress = (latestFocusHour !== null && latestFocusHour < 7) ? 100 : 0
          unlocked = latestFocusHour !== null && latestFocusHour < 7
          break

        case ACHIEVEMENT_IDS.NIGHT_OWL:
          progress = (latestFocusHour !== null && (latestFocusHour >= 23 || latestFocusHour < 5))
            ? 100
            : 0
          unlocked = latestFocusHour !== null && (latestFocusHour >= 23 || latestFocusHour < 5)
          break

        case ACHIEVEMENT_IDS.STREAK_7:
          progress = Math.min(100, (streakDays / 7) * 100)
          unlocked = streakDays >= 7
          break

        default:
          continue
      }

      // Update achievement in DB
      if (unlocked) {
        await db.achievements.update(ach.id, {
          unlockedAt: Date.now(),
          progress: 100,
        })
        ach.unlockedAt = Date.now()
        ach.progress = 100
        newlyUnlocked.push(ach)
        console.log(`[Achievement] Unlocked: ${ach.title}`)
      } else if (progress !== ach.progress) {
        await db.achievements.update(ach.id, { progress })
        ach.progress = progress
      }
    }
  } catch (err) {
    console.error('[Achievement] Error checking achievements:', err)
  }

  return newlyUnlocked
}

/**
 * Calculate the current consecutive day streak ending today.
 */
function calculateStreak(focusLogs: Array<{ date: string }>): number {
  if (focusLogs.length === 0) return 0

  // Get unique dates (YYYY-MM-DD), sorted descending
  const uniqueDates = [...new Set(focusLogs.map((l) => l.date))].sort().reverse()

  if (uniqueDates.length === 0) return 0

  const today = new Date()
  const todayStr = formatDateStr(today)
  const yesterdayStr = formatDateStr(new Date(today.getTime() - 86400000))

  // Must have studied today or yesterday to be in a streak
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) {
    return 0
  }

  let streak = 1
  let checkDate = new Date(
    uniqueDates[0] === todayStr ? today.getTime() : today.getTime() - 86400000,
  )

  for (let i = uniqueDates[0] === todayStr ? 1 : 0; i < uniqueDates.length; i++) {
    const expectedDate = new Date(checkDate.getTime() - streak * 86400000)
    const expectedStr = formatDateStr(expectedDate)

    if (uniqueDates[i] === expectedStr) {
      streak++
    } else {
      break
    }
  }

  return streak
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
