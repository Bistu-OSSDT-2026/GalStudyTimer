export interface StudyLog {
  id?: number
  subjectId: number
  date: string               // YYYY-MM-DD
  startTime: number          // Date.now()
  endTime: number
  duration: number           // seconds
  type: 'focus' | 'break'
  completed: boolean
}

export interface DailyStats {
  date: string
  totalMinutes: number
  sessionsCompleted: number
  subjectBreakdown: Record<number, number>  // subjectId → minutes
}
