export type AudioCategory = 'whitenoise' | 'music'

export interface AudioTrack {
  id?: number
  name: string
  category: AudioCategory
  source: 'builtin' | 'user'
  blobKey?: string            // IndexedDB key for user-uploaded blobs
  volume: number              // 0-1 per-track volume
  isLooping: boolean
}
