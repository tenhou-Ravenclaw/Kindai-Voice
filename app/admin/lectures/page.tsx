'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/supabase/auth-client'
import type { Lecture, Course } from '@/lib/supabase/types'

export default function LecturesPage() {
  const router = useRouter()
  const [lectures, setLectures] = useState<(Lecture & { courses: Course })[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingLecture, setEditingLecture] = useState<Lecture | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [formData, setFormData] = useState({
    course_id: '',
    session_number: 1,
    status: 'scheduled' as 'scheduled' | 'active' | 'ended' | 'summarized',
    scheduled_start_time: '',
    scheduled_end_time: '',
    is_rescheduled: false,
  })

  useEffect(() => {
    fetchCourses()
    fetchLectures()
  }, [])

  useEffect(() => {
    if (selectedCourseId) {
      fetchLectures(selectedCourseId)
    } else {
      fetchLectures()
    }
  }, [selectedCourseId])

  const getAuthToken = async () => {
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()
    return session?.access_token || null
  }

  const fetchCourses = async () => {
    try {
      const token = await getAuthToken()
      const response = await fetch('/api/admin/courses', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setCourses(data.courses || [])
      }
    } catch (error) {
      console.error('コース取得エラー:', error)
    }
  }

  const fetchLectures = async (courseId?: string) => {
    try {
      const token = await getAuthToken()
      const url = courseId
        ? `/api/admin/lectures?course_id=${courseId}`
        : '/api/admin/lectures'
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        setLectures(data.lectures || [])
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('講義セッション取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const token = await getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const url = editingLecture
        ? `/api/admin/lectures/${editingLecture.id}`
        : '/api/admin/lectures'
      const method = editingLecture ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        setIsModalOpen(false)
        setEditingLecture(null)
        setFormData({
          course_id: '',
          session_number: 1,
          status: 'scheduled',
          scheduled_start_time: '',
          scheduled_end_time: '',
          is_rescheduled: false,
        })
        fetchLectures(selectedCourseId || undefined)
      } else {
        const data = await response.json()
        alert(data.error || 'エラーが発生しました')
      }
    } catch (error) {
      console.error('講義セッション保存エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const handleEdit = (lecture: Lecture & { courses: Course }) => {
    setEditingLecture(lecture)
    setFormData({
      course_id: lecture.course_id,
      session_number: lecture.session_number,
      status: lecture.status,
      scheduled_start_time: lecture.scheduled_start_time
        ? new Date(lecture.scheduled_start_time).toISOString().slice(0, 16)
        : '',
      scheduled_end_time: lecture.scheduled_end_time
        ? new Date(lecture.scheduled_end_time).toISOString().slice(0, 16)
        : '',
      is_rescheduled: lecture.is_rescheduled,
    })
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この講義セッションを削除しますか？')) return

    try {
      const token = await getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/admin/lectures/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        fetchLectures(selectedCourseId || undefined)
      } else {
        const data = await response.json()
        alert(data.error || '削除に失敗しました')
      }
    } catch (error) {
      console.error('講義セッション削除エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const statusLabels: Record<string, string> = {
    scheduled: '開催前',
    active: '開催中',
    ended: '終了',
    summarized: '要約済み',
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            講義セッション管理
          </h1>
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
            >
              戻る
            </button>
            <button
              onClick={() => {
                setEditingLecture(null)
                setFormData({
                  course_id: '',
                  session_number: 1,
                  status: 'scheduled',
                  scheduled_start_time: '',
                  scheduled_end_time: '',
                  is_rescheduled: false,
                })
                setIsModalOpen(true)
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
            >
              新規作成
            </button>
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            コースでフィルター
          </label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full md:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">すべてのコース</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>
        </div>

        {/* テーブル */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  コース
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  回数
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  ステータス
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  開始時刻
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  終了時刻
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {lectures.map((lecture) => (
                <tr key={lecture.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {lecture.courses?.code || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    第{lecture.session_number}回
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        lecture.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : lecture.status === 'ended'
                          ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          : lecture.status === 'summarized'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}
                    >
                      {statusLabels[lecture.status] || lecture.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {lecture.scheduled_start_time
                      ? new Date(lecture.scheduled_start_time).toLocaleString('ja-JP')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {lecture.scheduled_end_time
                      ? new Date(lecture.scheduled_end_time).toLocaleString('ja-JP')
                      : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button
                      onClick={() => handleEdit(lecture)}
                      className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                    >
                      編集
                    </button>
                    <button
                      onClick={() => handleDelete(lecture.id)}
                      className="text-red-600 hover:text-red-900 dark:text-red-400"
                    >
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* モーダル */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                {editingLecture ? '講義セッション編集' : '講義セッション新規作成'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    コース *
                  </label>
                  <select
                    value={formData.course_id}
                    onChange={(e) => setFormData({ ...formData, course_id: e.target.value })}
                    required
                    disabled={!!editingLecture}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                  >
                    <option value="">選択してください</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      回数 *
                    </label>
                    <input
                      type="number"
                      value={formData.session_number}
                      onChange={(e) =>
                        setFormData({ ...formData, session_number: parseInt(e.target.value) })
                      }
                      required
                      min={1}
                      max={15}
                      disabled={!!editingLecture}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ステータス *
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          status: e.target.value as 'scheduled' | 'active' | 'ended' | 'summarized',
                        })
                      }
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="scheduled">開催前</option>
                      <option value="active">開催中</option>
                      <option value="ended">終了</option>
                      <option value="summarized">要約済み</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      開始時刻
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_start_time}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduled_start_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      終了時刻
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.scheduled_end_time}
                      onChange={(e) =>
                        setFormData({ ...formData, scheduled_end_time: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.is_rescheduled}
                      onChange={(e) =>
                        setFormData({ ...formData, is_rescheduled: e.target.checked })
                      }
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      日程変更あり
                    </span>
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false)
                      setEditingLecture(null)
                    }}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                  >
                    {editingLecture ? '更新' : '作成'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

