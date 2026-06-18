import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, BookOpen, CheckCircle, XCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import type { TrainingCourse } from '../../types'

interface TrainingCompletion {
  id: string
  user_name: string
  email: string
  course_title: string
  score: number | null
  passed: boolean | null
  completed_at: string
}

export function Training() {
  const { user } = useAuth()
  const qc = useQueryClient()

  const [showAddCourse, setShowAddCourse] = useState(false)
  const [courseTitle, setCourseTitle] = useState('')
  const [passMark, setPassMark] = useState(80)

  const { data: courses = [] } = useQuery<TrainingCourse[]>({
    queryKey: ['training-courses'],
    queryFn: () => api.get<TrainingCourse[]>('/training/courses'),
  })

  const { data: completions = [] } = useQuery<TrainingCompletion[]>({
    queryKey: ['training-completions', user?.tenant_id],
    enabled: !!user?.tenant_id,
    queryFn: () => api.get<TrainingCompletion[]>(`/training/completions?tenant_id=${user!.tenant_id}`),
  })

  const addCourse = useMutation({
    mutationFn: () =>
      api.post<TrainingCourse>('/training/courses', {
        title: courseTitle,
        modules_json: [],
        pass_mark: passMark,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['training-courses'] })
      setCourseTitle('')
      setPassMark(80)
      setShowAddCourse(false)
    },
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-navy">Training</h1>
        <button
          onClick={() => setShowAddCourse(v => !v)}
          className="flex items-center gap-1.5 px-3 py-2 bg-teal text-white rounded-lg text-sm font-medium"
        >
          <Plus size={15} />
          Add Course
        </button>
      </div>

      {showAddCourse && (
        <div className="card mb-6">
          <h2 className="text-base font-semibold text-navy mb-4">New Course</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Course title</label>
              <input
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                placeholder="e.g. Counter-Terrorism Awareness"
                value={courseTitle}
                onChange={e => setCourseTitle(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Pass mark (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full"
                value={passMark}
                onChange={e => setPassMark(Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => addCourse.mutate()}
              disabled={!courseTitle}
              className="px-4 py-2 bg-teal text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              Save Course
            </button>
            <button onClick={() => setShowAddCourse(false)} className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600">
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {courses.length === 0 && (
          <div className="card text-center text-gray-400 col-span-3 py-10">No courses yet</div>
        )}
        {courses.map(course => {
          const count = completions.filter(c => c.course_title === course.title).length
          return (
            <div key={course.id} className="card">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 rounded-full bg-navy/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen size={16} className="text-navy" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-navy text-sm truncate">{course.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">Pass mark: {course.pass_mark}%</div>
                  <div className="text-xs text-gray-400 mt-0.5">{count} completion{count !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="card">
        <h2 className="text-base font-semibold text-navy mb-4">Completion Records</h2>
        {completions.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No completions recorded yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Staff Name', 'Course', 'Score', 'Passed', 'Date'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completions.map(c => (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2.5">
                      <div className="font-medium text-navy">{c.user_name}</div>
                      <div className="text-xs text-gray-400">{c.email}</div>
                    </td>
                    <td className="px-3 py-2.5 text-gray-700">{c.course_title}</td>
                    <td className="px-3 py-2.5">{c.score !== null ? `${c.score}%` : '—'}</td>
                    <td className="px-3 py-2.5">
                      {c.passed === true && <CheckCircle size={16} className="text-teal" />}
                      {c.passed === false && <XCircle size={16} className="text-red-500" />}
                      {c.passed === null && <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 whitespace-nowrap">
                      {new Date(c.completed_at).toLocaleDateString('en-GB')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
