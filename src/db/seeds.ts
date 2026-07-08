import { db } from './index'
import type { Achievement, AppSettings, Subject } from '../types'
import { ACHIEVEMENT_IDS, DEFAULT_FOCUS_MINUTES, DEFAULT_BREAK_MINUTES, DEFAULT_LONG_BREAK_MINUTES, LONG_BREAK_INTERVAL, DEFAULT_OLLAMA_ENDPOINT, DEFAULT_OLLAMA_MODEL, DEFAULT_OPENAI_MODEL } from '../utils/constants'

const DEFAULT_SUBJECTS: Omit<Subject, 'id'>[] = [
  {
    name: '语文',
    color: '#dc2626',
    spriteData: { default: '/sprites/literature.png' },
    spriteScale: 1,
    personaName: '文芷',
    personaPrompt: '你是一位古典文学少女，说话优雅温柔，喜欢引用诗词典故。你热爱中国文学，性格温婉但不失坚定。',
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    name: '数学',
    color: '#2563eb',
    spriteData: { default: '/sprites/math.jpg' },
    spriteScale: 1,
    personaName: '洛基',
    personaPrompt: '你是一位理性冷静的数学天才，说话简洁精准，偶尔会吐槽。你喜欢用逻辑解决问题，虽然表面冷淡但其实很关心学生的学习进度。',
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    name: '英语',
    color: '#d97706',
    spriteData: { default: null },
    spriteScale: 1,
    personaName: 'Lily',
    personaPrompt: '你是一位活泼开朗的英语母语者，中英双语流利，喜欢用简单的英语和学生交流。你性格阳光，总是充满热情地鼓励学生。',
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    name: '物理',
    color: '#7c3aed',
    spriteData: { default: null },
    spriteScale: 1,
    personaName: '爱因',
    personaPrompt: '你是一位充满好奇心的物理学家少女，喜欢用实验和现象解释物理原理。说话带着对世界的惊奇感，总能把复杂的概念讲得很有趣。',
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    name: '计算机',
    color: '#0891b2',
    spriteData: { default: null },
    spriteScale: 1,
    personaName: 'C-chan',
    personaPrompt: '你是一位现代科技宅女，热爱编程和新技术。说话夹杂着技术梗，偶尔会冒出代码术语。外表酷酷的但其实很乐于助人。',
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    name: '历史',
    color: '#059669',
    spriteData: { default: null },
    spriteScale: 1,
    personaName: '千岁',
    personaPrompt: '你是一位穿越时空的历史见证者，知识渊博，说话带着古风韵味。你亲身经历过各个朝代，能将历史讲得像故事一样生动。',
    isArchived: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
]

const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: ACHIEVEMENT_IDS.FIRST_FOCUS,
    title: '初次专注',
    description: '完成第一次番茄钟',
    icon: '🌟',
    unlockedAt: null,
    progress: 0,
  },
  {
    id: ACHIEVEMENT_IDS.FOCUS_10,
    title: '专注新手',
    description: '完成10次番茄钟',
    icon: '🔥',
    unlockedAt: null,
    progress: 0,
  },
  {
    id: ACHIEVEMENT_IDS.FOCUS_100,
    title: '专注大师',
    description: '完成100次番茄钟',
    icon: '👑',
    unlockedAt: null,
    progress: 0,
  },
  {
    id: ACHIEVEMENT_IDS.HOUR_1,
    title: '初入佳境',
    description: '累计学习1小时',
    icon: '⏰',
    unlockedAt: null,
    progress: 0,
  },
  {
    id: ACHIEVEMENT_IDS.HOUR_10,
    title: '学有所成',
    description: '累计学习10小时',
    icon: '📖',
    unlockedAt: null,
    progress: 0,
  },
  {
    id: ACHIEVEMENT_IDS.HOUR_100,
    title: '学霸之路',
    description: '累计学习100小时',
    icon: '🎓',
    unlockedAt: null,
    progress: 0,
  },
  {
    id: ACHIEVEMENT_IDS.ALL_SUBJECTS,
    title: '全面发展',
    description: '在所有科目都完成过番茄钟',
    icon: '🌈',
    unlockedAt: null,
    progress: 0,
  },
  {
    id: ACHIEVEMENT_IDS.STREAK_7,
    title: '连续打卡',
    description: '连续7天学习',
    icon: '📅',
    unlockedAt: null,
    progress: 0,
  },
]

const DEFAULT_SETTINGS: AppSettings = {
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
  ttsProvider: 'browser',
  ttsVoiceName: '',
  ttsRate: 1.0,
  ttsPitch: 1.0,
  ttsVolume: 90,
}

export async function seedIfEmpty(): Promise<void> {
  const subjectCount = await db.subjects.count()
  if (subjectCount === 0) {
    await db.subjects.bulkAdd(DEFAULT_SUBJECTS)
    console.log('[Seed] Added default subjects')
  } else {
    // Migration: fix 语文 sprite if it's still null
    const literature = await db.subjects.where('name').equals('语文').first()
    if (literature && !literature.spriteData.default) {
      await db.subjects.update(literature.id!, {
        spriteData: { default: '/sprites/literature.png' },
        updatedAt: Date.now(),
      })
      console.log('[Seed] Updated 语文 sprite with default image')
    }

    // Migration: fix 数学 sprite if it's still null
    const math = await db.subjects.where('name').equals('数学').first()
    if (math && !math.spriteData.default) {
      await db.subjects.update(math.id!, {
        spriteData: { default: '/sprites/math.jpg' },
        updatedAt: Date.now(),
      })
      console.log('[Seed] Updated 数学 sprite with default image')
    }

    // Migration: set spriteScale to 1 for subjects that don't have it
    const allSubjects = await db.subjects.toArray()
    for (const s of allSubjects) {
      if (s.spriteScale === undefined) {
        await db.subjects.update(s.id!, { spriteScale: 1 })
        console.log(`[Seed] Set spriteScale=1 for subject "${s.name}"`)
      }
    }
  }

  const achievementCount = await db.achievements.count()
  if (achievementCount === 0) {
    await db.achievements.bulkAdd(DEFAULT_ACHIEVEMENTS)
    console.log('[Seed] Added default achievements')
  }

  const settingsCount = await db.settings.count()
  if (settingsCount === 0) {
    await db.settings.add(DEFAULT_SETTINGS)
    console.log('[Seed] Added default settings')
  }
}
