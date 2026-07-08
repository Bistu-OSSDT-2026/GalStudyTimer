import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { AudioCategory } from '../../types'

interface AudioFilePickerProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, name: string, category: AudioCategory) => Promise<void>
}

export function AudioFilePicker({ isOpen, onClose, onUpload }: AudioFilePickerProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<AudioCategory>('music')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      if (!name) setName(f.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleUpload = async () => {
    if (!file || !name.trim()) return
    setUploading(true)
    try {
      await onUpload(file, name.trim(), category)
      setName('')
      setFile(null)
      onClose()
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0.9 }}
          className="glass p-6 w-96 max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-4">上传音频</h3>

          <div className="space-y-4">
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* File selector */}
            <div
              className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center cursor-pointer hover:border-primary-500/30 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {file ? (
                <div>
                  <span className="text-2xl">🎵</span>
                  <p className="text-sm text-white/60 mt-1">{file.name}</p>
                  <p className="text-xs text-white/30">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <span className="text-3xl">📁</span>
                  <p className="text-sm text-white/40 mt-2">点击选择音频文件</p>
                  <p className="text-xs text-white/20">支持 MP3, WAV</p>
                </div>
              )}
            </div>

            {/* Name */}
            <input
              type="text"
              className="glass-input w-full"
              placeholder="音频名称"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            {/* Category */}
            <div className="flex gap-2">
              <button
                className={`flex-1 py-2 rounded-lg text-sm ${category === 'music' ? 'bg-primary-600/20 border border-primary-500/30 text-primary-400' : 'btn-ghost'}`}
                onClick={() => setCategory('music')}
              >
                🎵 轻音乐
              </button>
              <button
                className={`flex-1 py-2 rounded-lg text-sm ${category === 'whitenoise' ? 'bg-primary-600/20 border border-primary-500/30 text-primary-400' : 'btn-ghost'}`}
                onClick={() => setCategory('whitenoise')}
              >
                🌧 白噪音
              </button>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button className="btn-ghost flex-1" onClick={onClose}>取消</button>
            <button
              className="btn-primary flex-1"
              onClick={handleUpload}
              disabled={!file || !name.trim() || uploading}
            >
              {uploading ? '上传中...' : '上传'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
