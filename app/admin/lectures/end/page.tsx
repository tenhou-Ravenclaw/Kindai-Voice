'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/supabase/auth-client'
import type { Lecture } from '@/lib/supabase/types'

export default function LectureEndPage() {
  const router = useRouter()
  const [lectures, setLectures] = useState<(Lecture & { courses: { code: string; title: string } })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  useEffect(() => {
    fetchEndedLectures()
  }, [])

  const getAuthToken = async () => {
    const {
      data: { session },
    } = await supabaseAuth.auth.getSession()
    return session?.access_token || null
  }

  const fetchEndedLectures = async () => {
    try {
      const token = await getAuthToken()
      // すべての講義を取得して、クライアント側でフィルタリング
      const response = await fetch('/api/admin/lectures', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      if (response.ok) {
        // 終了済みまたは要約済みの講義をフィルタリング
        const filtered = (data.lectures || []).filter(
          (l: Lecture & { courses: { code: string; title: string } }) =>
            l.status === 'ended' || l.status === 'summarized' || l.status === 'active'
        )
        setLectures(filtered)
      } else if (response.status === 401) {
        router.push('/login')
      }
    } catch (error) {
      console.error('講義取得エラー:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEndLecture = async (lectureId: string) => {
    if (!confirm('この講義を終了しますか？')) return

    try {
      const token = await getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/lectures/${lectureId}/end`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        alert('講義を終了しました')
        fetchEndedLectures()
      } else {
        const data = await response.json()
        alert(data.error || '講義の終了に失敗しました')
      }
    } catch (error) {
      console.error('講義終了エラー:', error)
      alert('エラーが発生しました')
    }
  }

  const handleDeleteData = async (lectureId: string) => {
    if (
      !confirm(
        '⚠️ 警告: この操作は不可逆的です。\n\n講義の生データ（投稿・いいね）を完全に削除します。\n\n本当に実行しますか？'
      )
    )
      return

    setProcessingId(lectureId)

    try {
      const token = await getAuthToken()
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/lectures/${lectureId}/delete-data`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const data = await response.json()

      if (response.ok) {
        alert(
          `データ削除が完了しました\n削除された投稿: ${data.deleted_posts_count}件\n削除されたいいね: ${data.deleted_likes_count}件`
        )
        fetchEndedLectures()
      } else {
        alert(data.error || 'データ削除に失敗しました')
      }
    } catch (error) {
      console.error('データ削除エラー:', error)
      alert('エラーが発生しました')
    } finally {
      setProcessingId(null)
    }
  }

  const getStats = async (lectureId: string) => {
    try {
      const token = await getAuthToken()
      const response = await fetch(`/api/lectures/${lectureId}/delete-data`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      return data
    } catch (error) {
      console.error('統計情報取得エラー:', error)
      return null
    }
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
            講義終了管理
          </h1>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
          >
            戻る
          </button>
        </div>

        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            ⚠️ 注意: データ削除は不可逆的な操作です。削除されたデータは復元できません。
          </p>
        </div>

        <div className="space-y-4">
          {lectures.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                終了した講義がありません
              </p>
            </div>
          ) : (
            lectures.map((lecture) => (
              <LectureCard
                key={lecture.id}
                lecture={lecture}
                onEnd={handleEndLecture}
                onDeleteData={handleDeleteData}
                processingId={processingId}
                getStats={getStats}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function LectureCard({
  lecture,
  onEnd,
  onDeleteData,
  processingId,
  getStats,
}: {
  lecture: Lecture & { courses: { code: string; title: string } }
  onEnd: (id: string) => void
  onDeleteData: (id: string) => void
  processingId: string | null
  getStats: (id: string) => Promise<any>
}) {
  const [stats, setStats] = useState<any>(null)
  const [loadingStats, setLoadingStats] = useState(false)

  const loadStats = async () => {
    setLoadingStats(true)
    const data = await getStats(lecture.id)
    setStats(data)
    setLoadingStats(false)
  }

  useEffect(() => {
    if (lecture.status === 'ended' || lecture.status === 'summarized') {
      loadStats()
    }
  }, [lecture.id, lecture.status])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {lecture.courses?.code || '-'} - {lecture.courses?.title || '-'} 第{lecture.session_number}回
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            ステータス: {lecture.status === 'ended' ? '終了' : lecture.status === 'summarized' ? '要約済み' : lecture.status}
          </p>
        </div>
      </div>

      {stats && (
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            統計情報
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">投稿数:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {stats.posts_count || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">いいね数:</span>
              <span className="ml-2 font-medium text-gray-900 dark:text-white">
                {stats.likes_count || 0}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3">
        {lecture.status === 'active' && (
          <button
            onClick={() => onEnd(lecture.id)}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded-lg"
          >
            講義を終了
          </button>
        )}
        {(lecture.status === 'ended' || lecture.status === 'summarized') && (
          <>
            {!stats && (
              <button
                onClick={loadStats}
                disabled={loadingStats}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {loadingStats ? '読み込み中...' : '統計情報を表示'}
              </button>
            )}
            {lecture.status === 'ended' && (
              <button
                onClick={() => onDeleteData(lecture.id)}
                disabled={processingId === lecture.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg disabled:opacity-50"
              >
                {processingId === lecture.id ? '削除中...' : '生データを削除'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

