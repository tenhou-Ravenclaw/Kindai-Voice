'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/supabase/auth-client'
import type { Course } from '@/lib/supabase/types'

export default function CoursesPage() {
    const router = useRouter()
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editingCourse, setEditingCourse] = useState<Course | null>(null)
    const [formData, setFormData] = useState({
        code: '',
        title: '',
        total_sessions: 15,
        regular_day_of_week: 1,
        regular_start_time: '10:00',
        regular_end_time: '11:30',
        first_session_date: '',
    })

    useEffect(() => {
        // レイアウトで認証チェックを行っているため、ここではデータ取得のみ
        fetchCourses()
    }, [])

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
            } else if (response.status === 401) {
                router.push('/login')
            }
        } catch (error) {
            console.error('コース取得エラー:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const token = await getAuthToken()
            if (!token) {
                router.push('/admin/login')
                return
            }

            const url = editingCourse
                ? `/api/admin/courses/${editingCourse.id}`
                : '/api/admin/courses'
            const method = editingCourse ? 'PUT' : 'POST'

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
                setEditingCourse(null)
                setFormData({
                    code: '',
                    title: '',
                    total_sessions: 15,
                    regular_day_of_week: 1,
                    regular_start_time: '10:00',
                    regular_end_time: '11:30',
                    first_session_date: '',
                })
                fetchCourses()
            } else {
                const data = await response.json()
                alert(data.error || 'エラーが発生しました')
            }
        } catch (error) {
            console.error('コース保存エラー:', error)
            alert('エラーが発生しました')
        }
    }

    const handleEdit = (course: Course) => {
        setEditingCourse(course)
        setFormData({
            code: course.code,
            title: course.title,
            total_sessions: course.total_sessions,
            regular_day_of_week: course.regular_day_of_week || 1,
            regular_start_time: course.regular_start_time?.substring(0, 5) || '10:00',
            regular_end_time: course.regular_end_time?.substring(0, 5) || '11:30',
            first_session_date: course.first_session_date || '',
        })
        setIsModalOpen(true)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('このコースを削除しますか？')) return

        try {
            const token = await getAuthToken()
            if (!token) {
                router.push('/login')
                return
            }

            const response = await fetch(`/api/admin/courses/${id}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                fetchCourses()
            } else {
                const data = await response.json()
                alert(data.error || '削除に失敗しました')
            }
        } catch (error) {
            console.error('コース削除エラー:', error)
            alert('エラーが発生しました')
        }
    }

    const dayNames = ['日', '月', '火', '水', '木', '金', '土']

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
                        コース管理
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
                                setEditingCourse(null)
                                setFormData({
                                    code: '',
                                    title: '',
                                    total_sessions: 15,
                                    regular_day_of_week: 1,
                                    regular_start_time: '10:00',
                                    regular_end_time: '11:30',
                                    first_session_date: '',
                                })
                                setIsModalOpen(true)
                            }}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                        >
                            新規作成
                        </button>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    コード
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    タイトル
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    総回数
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    曜日
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    時間
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {courses.map((course) => (
                                <tr key={course.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        {course.code}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                        {course.title}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {course.total_sessions}回
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {course.regular_day_of_week !== null
                                            ? dayNames[course.regular_day_of_week]
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {course.regular_start_time && course.regular_end_time
                                            ? `${course.regular_start_time.substring(0, 5)} - ${course.regular_end_time.substring(0, 5)}`
                                            : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => handleEdit(course)}
                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400"
                                        >
                                            編集
                                        </button>
                                        <button
                                            onClick={() => handleDelete(course.id)}
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
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-2xl w-full mx-4">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                                {editingCourse ? 'コース編集' : 'コース新規作成'}
                            </h2>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        講義コード *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                        required
                                        maxLength={10}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        講義タイトル *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        required
                                        maxLength={255}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            総回数 *
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.total_sessions}
                                            onChange={(e) => setFormData({ ...formData, total_sessions: parseInt(e.target.value) })}
                                            required
                                            min={1}
                                            max={15}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            曜日
                                        </label>
                                        <select
                                            value={formData.regular_day_of_week}
                                            onChange={(e) => setFormData({ ...formData, regular_day_of_week: parseInt(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="">選択なし</option>
                                            {dayNames.map((day, index) => (
                                                <option key={index} value={index}>
                                                    {day}曜日
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            開始時刻
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.regular_start_time}
                                            onChange={(e) => setFormData({ ...formData, regular_start_time: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            終了時刻
                                        </label>
                                        <input
                                            type="time"
                                            value={formData.regular_end_time}
                                            onChange={(e) => setFormData({ ...formData, regular_end_time: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        第1回目開催日
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.first_session_date}
                                        onChange={(e) => setFormData({ ...formData, first_session_date: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex justify-end space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsModalOpen(false)
                                            setEditingCourse(null)
                                        }}
                                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 font-medium rounded-lg"
                                    >
                                        キャンセル
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
                                    >
                                        {editingCourse ? '更新' : '作成'}
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

