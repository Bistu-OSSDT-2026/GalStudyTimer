import Dexie, { type Table } from 'dexie'
import type { Subject, StudyLog, Achievement, AppSettings, AffectionScore, AudioTrack } from '../types'

export interface ChatMessage {
  id?: number
  subjectId: number
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export class GalStudyDB extends Dexie {
  subjects!: Table<Subject, number>
  studyLogs!: Table<StudyLog, number>
  achievements!: Table<Achievement, string>
  settings!: Table<AppSettings, 'current'>
  affectionScores!: Table<AffectionScore, number>
  audioTracks!: Table<AudioTrack, number>
  chatMessages!: Table<ChatMessage, number>
  blobStore!: Table<{ key: string; blob: Blob }, string>

  constructor() {
    super('GalStudyDB')

    this.version(1).stores({
      subjects: '++id, name, isArchived, createdAt',
      studyLogs: '++id, subjectId, date, type, [date+subjectId]',
      achievements: 'id, unlockedAt',
      settings: 'id',
      affectionScores: '++id, subjectId',
      blobStore: 'key',
    })

    // v2: add audio tracks table
    this.version(2).stores({
      subjects: '++id, name, isArchived, createdAt',
      studyLogs: '++id, subjectId, date, type, [date+subjectId]',
      achievements: 'id, unlockedAt',
      settings: 'id',
      affectionScores: '++id, subjectId',
      audioTracks: '++id, category, source',
      blobStore: 'key',
    })

    // v3: add chat messages table
    this.version(3).stores({
      subjects: '++id, name, isArchived, createdAt',
      studyLogs: '++id, subjectId, date, type, [date+subjectId]',
      achievements: 'id, unlockedAt',
      settings: 'id',
      affectionScores: '++id, subjectId',
      audioTracks: '++id, category, source',
      chatMessages: '++id, subjectId, timestamp',
      blobStore: 'key',
    })

    // v4: add startTime index to studyLogs for efficient ordering
    this.version(4).stores({
      subjects: '++id, name, isArchived, createdAt',
      studyLogs: '++id, subjectId, date, type, startTime, [date+subjectId]',
      achievements: 'id, unlockedAt',
      settings: 'id',
      affectionScores: '++id, subjectId',
      audioTracks: '++id, category, source',
      chatMessages: '++id, subjectId, timestamp',
      blobStore: 'key',
    })
  }
}

export const db = new GalStudyDB()
