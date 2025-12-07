'use client'

import { useParams } from 'next/navigation'

export default function LecturePage() {
  const params = useParams()
  const lectureId = params.id as string

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h1 className="text-2xl font-bold mb-4">講義ページ</h1>
          <p className="text-gray-600 dark:text-gray-400">
            講義ID: {lectureId}
          </p>
          <p className="mt-4 text-sm text-gray-500">
            投稿画面は今後実装します
          </p>
        </div>
      </div>
    </div>
  )
}

