import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { db } from '../../db'
import { useTimerStore } from '../../stores/timerStore'
import type { Subject } from '../../types'
import { SubjectEditor } from './SubjectEditor'

export function SubjectPage() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const currentSubjectId = useTimerStore((s) => s.currentSubjectId)
  const setSubject = useTimerStore((s) => s.setSubject)
  const navigate = useNavigate()

  const loadSubjects = () => {
    db.subjects.orderBy('createdAt').toArray().then(setSubjects)
  }

  useEffect(() => { loadSubjects() }, [])

  const handleSave = async (data: Omit<Subject, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingSubject?.id) {
      await db.subjects.update(editingSubject.id, {
        ...data,
        updatedAt: Date.now(),
      })
    } else {
      await db.subjects.add({
        ...data,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      })
    }
    loadSubjects()
  }

  const handleDelete = async (id: number) => {
    // If deleting the currently selected subject, deselect it
    if (id === currentSubjectId) {
      setSubject(null)
    }
    await db.subjects.delete(id)
    setDeleteConfirm(null)
    loadSubjects()
  }

  const handleEdit = (subject: Subject) => {
    setEditingSubject(subject)
    setEditorOpen(true)
  }

  const handleAdd = () => {
    setEditingSubject(null)
    setEditorOpen(true)
  }

  const handleSelect = (subject: Subject) => {
    setSubject(subject.id!)
    // Navigate to timer page to start studying
    navigate('/')
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">科目管理</h2>
          <p className="text-white/40 text-sm mt-1">管理学习科目和角色立绘</p>
        </div>
        <button className="btn-primary" onClick={handleAdd}>
          + 新增科目
        </button>
      </div>

      {/* Subject grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {subjects.map((subject) => {
            const isSelected = subject.id === currentSubjectId

            return (
              <motion.div
                key={subject.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`glass-card p-5 group relative overflow-hidden transition-all duration-300
                  ${isSelected ? 'ring-2 ring-offset-2 ring-offset-surface-950 shadow-xl' : ''}`}
                style={isSelected ? {
                  borderColor: subject.color + '80',
                  boxShadow: `0 0 30px ${subject.color}20`,
                } : {}}
              >
                {/* Selected indicator */}
                {isSelected && (
                  <div
                    className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold z-10"
                    style={{ backgroundColor: subject.color, color: '#fff' }}
                  >
                    当前科目
                  </div>
                )}

                {/* Sprite preview */}
                <div
                  className="w-full aspect-square rounded-xl overflow-hidden mb-4 flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: subject.color + '10' }}
                  onClick={() => handleSelect(subject)}
                >
                  {subject.spriteData.default ? (
                    <img
                      src={subject.spriteData.default}
                      alt={subject.name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center transition-transform hover:scale-110 duration-300">
                      <div className="text-6xl mb-2">📖</div>
                      <div className="text-xs text-white/30">点击选择此科目</div>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: subject.color }} />
                  <h3 className="font-medium">{subject.name}</h3>
                </div>
                {subject.personaName && (
                  <p className="text-xs text-white/30 mb-4">
                    🤖 {subject.personaName}
                  </p>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="btn-ghost text-xs flex-1 py-1.5"
                    onClick={() => handleEdit(subject)}
                  >
                    编辑
                  </button>
                  <button
                    className="btn-ghost text-xs flex-1 py-1.5 text-red-400 hover:text-red-300"
                    onClick={() => setDeleteConfirm(subject.id!)}
                  >
                    删除
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    className={`text-xs flex-1 py-2 rounded-lg font-medium transition-all duration-200
                      ${isSelected
                        ? 'text-white cursor-default'
                        : 'text-white/70 hover:text-white border border-white/10 hover:border-white/30'
                      }`}
                    style={isSelected ? { backgroundColor: subject.color } : {}}
                    onClick={() => !isSelected && handleSelect(subject)}
                  >
                    {isSelected ? '✓ 已选择' : '选择'}
                  </motion.button>
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {subjects.length === 0 && (
        <div className="text-center py-20 text-white/20">
          <div className="text-6xl mb-4">📚</div>
          <p>还没有科目，点击上方按钮添加吧~</p>
        </div>
      )}

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="glass p-6 w-80"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">确认删除</h3>
              <p className="text-white/60 text-sm mb-6">
                删除后学习日志仍会保留，但科目信息将无法恢复。
              </p>
              <div className="flex gap-3">
                <button className="btn-ghost flex-1" onClick={() => setDeleteConfirm(null)}>取消</button>
                <button
                  className="btn-primary flex-1 bg-red-500 hover:bg-red-400"
                  onClick={() => handleDelete(deleteConfirm)}
                >
                  确认删除
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editor modal */}
      <SubjectEditor
        isOpen={editorOpen}
        onClose={() => setEditorOpen(false)}
        onSave={handleSave}
        subject={editingSubject}
      />
    </div>
  )
}
