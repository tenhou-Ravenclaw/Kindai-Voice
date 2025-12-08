'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ActiveLecture {
  id: string
  session_number: number
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  course: {
    id: string
    code: string
    title: string
  } | null
}

function HomeContent() {
  const [code, setCode] = useState('')
  const [activeLectures, setActiveLectures] = useState<ActiveLecture[]>([])
  const [isLoadingLectures, setIsLoadingLectures] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  // アクティブな講義一覧を取得
  useEffect(() => {
    const fetchActiveLectures = async () => {
      try {
        const response = await fetch('/api/lectures/active')
        const data = await response.json()
        if (response.ok) {
          setActiveLectures(data.lectures || [])
        }
      } catch (err) {
        console.error('講義一覧取得エラー:', err)
      } finally {
        setIsLoadingLectures(false)
      }
    }

    fetchActiveLectures()
  }, [])

  // URLパラメータから講義コードを取得
  useEffect(() => {
    const urlCode = searchParams.get('code')
    if (urlCode) {
      setCode(urlCode.toUpperCase())
      handleCodeSubmit(urlCode.toUpperCase())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const handleCodeSubmit = async (codeToSubmit?: string) => {
    const finalCode = codeToSubmit || code.trim()
    
    if (!finalCode) {
      setError('講義コードを入力してください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/lectures/search?code=${encodeURIComponent(finalCode.toUpperCase())}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || '講義が見つかりませんでした')
        setIsLoading(false)
        return
      }

      // 投稿画面へ遷移
      router.push(`/lecture/${data.lecture.id}`)
    } catch (err) {
      console.error('講義検索エラー:', err)
      setError('接続エラーが発生しました。もう一度お試しください。')
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await handleCodeSubmit()
  }

  // 講義カードをクリックして直接入室
  const handleLectureClick = (lectureId: string) => {
    router.push(`/lecture/${lectureId}`)
  }

  // 日時をフォーマット（タイムゾーン対応）
  const formatTime = (dateString: string | null) => {
    if (!dateString) return '時間未設定'
    const date = new Date(dateString)
    
    // 無効な日付の場合はエラーを返す
    if (isNaN(date.getTime())) {
      console.error('Invalid date string:', dateString)
      return '時間不明'
    }
    
    return date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Tokyo',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-4xl mx-auto px-6 py-12">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Kindai Voice
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            講義用匿名オピニオンボード
          </p>
        </div>

        {/* アクティブな講義一覧 */}
        {isLoadingLectures ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            <div className="text-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
            </div>
          </div>
        ) : activeLectures.length > 0 ? (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              開催中の講義
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeLectures.map((lecture) => (
                <button
                  key={lecture.id}
                  onClick={() => handleLectureClick(lecture.id)}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left w-full border-2 border-transparent hover:border-indigo-500"
                >
                  {lecture.course ? (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400">
                          {lecture.course.code}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          第{lecture.session_number}回
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {lecture.course.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <span>開始: {formatTime(lecture.scheduled_start_time)}</span>
                        <span>終了: {formatTime(lecture.scheduled_end_time)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600 dark:text-gray-400">
                      講義情報が取得できませんでした
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 mb-6">
            <p className="text-center text-gray-600 dark:text-gray-400">
              現在開催中の講義はありません
            </p>
          </div>
        )}

        {/* 講義コード入力フォーム */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            講義コードで入室
          </h2>

          {/* 講義コード入力フォーム */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label 
                htmlFor="code" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                講義コード
              </label>
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase())
                  setError(null)
                }}
                placeholder="例: DB001"
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-lg text-center font-mono uppercase bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                disabled={isLoading}
                maxLength={10}
                autoFocus
              />
            </div>

            {/* エラーメッセージ */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-sm text-red-800 dark:text-red-200 text-center">
                  {error}
                </p>
              </div>
            )}

            {/* 送信ボタン */}
            <button
              type="submit"
              disabled={isLoading || !code.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  検索中...
                </span>
              ) : (
                '入室する'
              )}
            </button>
          </form>
        </div>

        {/* フッター */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-center text-gray-500 dark:text-gray-400">
            近畿大学情報学部 講義用匿名オピニオンボード
          </p>
        </div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <svg className="animate-spin h-8 w-8 text-indigo-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4 text-gray-600 dark:text-gray-400">読み込み中...</p>
        </div>
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}

