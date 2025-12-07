'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Post } from '@/lib/supabase/types'

export default function LecturePage() {
  const params = useParams()
  const lectureId = params.id as string

  const [content, setContent] = useState('')
  const [posts, setPosts] = useState<Post[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<'newest' | 'popular'>('newest')

  const maxLength = 200

  // 投稿一覧を取得
  const fetchPosts = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/posts/${lectureId}?sort=${sort}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の取得に失敗しました')
      }

      setPosts(data.posts || [])
    } catch (err) {
      console.error('投稿取得エラー:', err)
      setError(err instanceof Error ? err.message : '投稿の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  // 初回読み込み時とソート変更時に投稿を取得
  useEffect(() => {
    if (lectureId) {
      fetchPosts()
    }
  }, [lectureId, sort])

  // 投稿を送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('投稿内容を入力してください')
      return
    }

    if (content.trim().length > maxLength) {
      setError(`投稿内容は${maxLength}文字以内で入力してください`)
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lecture_id: lectureId,
          content: content.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || '投稿の作成に失敗しました')
      }

      // フォームをクリア
      setContent('')
      
      // 投稿一覧を再取得
      await fetchPosts()
    } catch (err) {
      console.error('投稿エラー:', err)
      setError(err instanceof Error ? err.message : '投稿の作成に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 日時をフォーマット
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)

    if (minutes < 1) {
      return 'たった今'
    } else if (minutes < 60) {
      return `${minutes}分前`
    } else if (minutes < 1440) {
      const hours = Math.floor(minutes / 60)
      return `${hours}時間前`
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* ヘッダー */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            講義ページ
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            匿名で質問や意見を投稿できます
          </p>
        </div>

        {/* 投稿フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="content"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                投稿内容
              </label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  setError(null)
                }}
                placeholder="質問や意見を入力してください（最大200文字）"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={4}
                maxLength={maxLength}
                disabled={isSubmitting}
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {content.length} / {maxLength} 文字
                </p>
                {content.length > maxLength * 0.9 && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    あと{maxLength - content.length}文字
                  </p>
                )}
              </div>
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isSubmitting || !content.trim() || content.length > maxLength}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  投稿中...
                </span>
              ) : (
                '投稿する'
              )}
            </button>
          </form>
        </div>

        {/* ソートタブ */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <div className="flex space-x-2">
            <button
              onClick={() => setSort('newest')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                sort === 'newest'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              新着順
            </button>
            <button
              onClick={() => setSort('popular')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                sort === 'popular'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              人気順
            </button>
          </div>
        </div>

        {/* タイムライン */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <svg
                className="animate-spin h-8 w-8 text-indigo-600 mx-auto"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
              <p className="text-gray-600 dark:text-gray-400">
                まだ投稿がありません。最初の投稿をしてみましょう！
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <p className="text-gray-900 dark:text-white mb-4 whitespace-pre-wrap break-words">
                  {post.content}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span>{formatDateTime(post.created_at)}</span>
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      {post.like_count}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
