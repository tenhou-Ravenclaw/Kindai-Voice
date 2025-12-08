'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import type { Summary } from '@/lib/supabase/types'

interface SummaryData {
  summary: Summary
  lecture: {
    id: string
    session_number: number
    status: string
    course: {
      id: string
      code: string
      title: string
    } | null
  } | null
}

export default function SummaryPage() {
  const params = useParams()
  const lectureId = params.id as string

  const handleClose = () => {
    // 新しいタブで開かれた場合は閉じる、それ以外はホームにリダイレクト
    if (window.opener || window.history.length <= 1) {
      window.close()
    } else {
      window.location.href = '/'
    }
  }

  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (lectureId) {
      fetchSummary()
    }
  }, [lectureId])

  const fetchSummary = async () => {
    try {
      const response = await fetch(`/api/lectures/${lectureId}/summary`)
      const data = await response.json()

      if (response.ok) {
        setSummaryData(data)
      } else {
        setError(data.error || '要約の取得に失敗しました')
      }
    } catch (err) {
      console.error('要約取得エラー:', err)
      setError('要約の取得に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
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
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
              <button
                onClick={handleClose}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg"
              >
                ページを閉じる
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!summaryData) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              {summaryData.lecture?.course ? (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {summaryData.lecture.course.code} - {summaryData.lecture.course.title}
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    第{summaryData.lecture.session_number}回 講義要約
                  </p>
                </div>
              ) : (
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  講義要約
                </h1>
              )}
            </div>
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg"
            >
              ページを閉じる
            </button>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            統計情報
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">総投稿数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryData.summary.total_posts_count || 0}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">総いいね数</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summaryData.summary.total_likes_count || 0}
              </p>
            </div>
          </div>
        </div>

        {/* 要約内容 */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            AI要約
          </h2>
          <div className="prose dark:prose-invert max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 leading-relaxed">
              {summaryData.summary.summary_text}
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              生成日時: {new Date(summaryData.summary.created_at).toLocaleString('ja-JP')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

