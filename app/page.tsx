'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const [code, setCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!code.trim()) {
      setError('講義コードを入力してください')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/lectures/search?code=${encodeURIComponent(code.trim().toUpperCase())}`)
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <main className="w-full max-w-md px-6 py-12">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* ヘッダー */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Kindai Voice
          </h1>
            <p className="text-gray-600 dark:text-gray-400">
              講義用匿名オピニオンボード
            </p>
          </div>

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
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center">
                講義コードを入力して入室してください
              </p>
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

          {/* フッター */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400">
              近畿大学情報学部 講義用匿名オピニオンボード
          </p>
        </div>
        </div>
      </main>
    </div>
  )
}
