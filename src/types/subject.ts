export interface SubjectSprites {
  default: string | null   // Blob URL or data URL
  happy?: string | null
  encourage?: string | null
}

export interface Subject {
  id?: number               // auto-incremented by Dexie
  name: string
  color: string             // hex color
  spriteData: SubjectSprites
  personaName: string       // AI character name
  personaPrompt: string     // AI system prompt
  spriteScale: number        // sprite zoom scale, default 1.0
  isArchived: boolean
  createdAt: number         // Date.now()
  updatedAt: number
}
