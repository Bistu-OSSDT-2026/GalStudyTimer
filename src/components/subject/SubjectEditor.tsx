import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Subject } from '../../types'
import { SUBJECT_COLORS } from '../../utils/constants'

interface SubjectEditorProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>
  subject?: Subject | null  // null = creating new, Subject = editing existing
}

export function SubjectEditor({ isOpen, onClose, onSave, subject }: SubjectEditorProps) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(SUBJECT_COLORS[0])
  const [personaName, setPersonaName] = useState('')
  const [personaPrompt, setPersonaPrompt] = useState('')
  const [spritePreview, setSpritePreview] = useState<string | null>(null)
  const [scale, setScale] = useState(1)
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Reset form when subject changes
  useEffect(() => {
    if (subject) {
      setName(subject.name)
      setColor(subject.color)
      setPersonaName(subject.personaName)
      setPersonaPrompt(subject.personaPrompt)
      setSpritePreview(subject.spriteData.default)
      setScale(subject.spriteScale ?? 1)
    } else {
      setName('')
      setColor(SUBJECT_COLORS[0])
      setPersonaName('')
      setPersonaPrompt('')
      setSpritePreview(null)
      setScale(1)
    }
  }, [subject, isOpen])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setSpritePreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave({
        name: name.trim(),
        color,
        spriteData: { default: spritePreview },
        spriteScale: scale,
        personaName: personaName.trim(),
        personaPrompt: personaPrompt.trim(),
        isArchived: false,
      })
      onClose()
    } finally {
      setSaving(false)
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
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="glass p-6 w-[500px] max-w-[90vw] max-h-[85vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-lg font-bold mb-6">
            {subject ? '编辑科目' : '新增科目'}
          </h3>

          <div className="space-y-5">
            {/* Name */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">科目名称 *</label>
              <input
                type="text"
                className="glass-input w-full"
                placeholder="例如：数学"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Color picker */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">主题颜色</label>
              <div className="flex gap-2">
                {SUBJECT_COLORS.map((c) => (
                  <button
                    key={c}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                    onClick={() => setColor(c)}
                  />
                ))}
              </div>
            </div>

            {/* Sprite upload */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">角色立绘</label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex items-center gap-4">
                <div
                  className="w-20 h-20 rounded-xl border border-white/10 overflow-hidden bg-white/5 flex items-center justify-center cursor-pointer hover:border-white/30 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {spritePreview ? (
                    <img src={spritePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl text-white/20">+</span>
                  )}
                </div>
                <span className="text-xs text-white/30">
                  点击上传角色立绘<br />支持 PNG/JPG，建议 512x512
                </span>
              </div>
            </div>

            {/* Scale slider */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">
                立绘缩放 <span className="text-white/40">{scale.toFixed(1)}x</span>
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-white/10 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary-400 [&::-webkit-slider-thumb]:cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-white/20 mt-1">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>

            {/* Persona name */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">
                AI 角色名 <span className="text-white/20">(Phase 2)</span>
              </label>
              <input
                type="text"
                className="glass-input w-full"
                placeholder="角色的名字"
                value={personaName}
                onChange={(e) => setPersonaName(e.target.value)}
              />
            </div>

            {/* Persona prompt */}
            <div>
              <label className="text-sm text-white/60 mb-2 block">
                AI 人设 <span className="text-white/20">(Phase 2)</span>
              </label>
              <textarea
                className="glass-input w-full h-20 resize-none"
                placeholder="描述角色的性格和说话风格..."
                value={personaPrompt}
                onChange={(e) => setPersonaPrompt(e.target.value)}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button className="btn-ghost flex-1" onClick={onClose}>
              取消
            </button>
            <button
              className="btn-primary flex-1"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
