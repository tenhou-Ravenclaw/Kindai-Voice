'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'
import { getUserIdentifier } from '@/lib/utils/user-identifier'
import type { Post, Course, Lecture } from '@/lib/supabase/types'

interface LectureInfo {
  lecture: Lecture
  course: Course | null
}

export default function LecturePage() {
    const params = useParams()
    const lectureId = params.id as string

    const [content, setContent] = useState('')
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [sort, setSort] = useState<'newest' | 'popular'>('newest')
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())
    const [likingPosts, setLikingPosts] = useState<Set<string>>(new Set())
    const [isLectureOpen, setIsLectureOpen] = useState(true)
    const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null)
    const [lectureInfo, setLectureInfo] = useState<LectureInfo | null>(null)

    const maxLength = 200
    const userIdentifier = getUserIdentifier()

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

            // いいね状態を取得
            if (data.posts && data.posts.length > 0) {
                const postIds = data.posts.map((p: Post) => p.id)
                const likedSet = new Set<string>()

                // 各投稿のいいね状態を確認
                await Promise.all(
                    postIds.map(async (postId: string) => {
                        try {
                            const response = await fetch(
                                `/api/likes?post_id=${postId}&user_identifier=${encodeURIComponent(userIdentifier)}`
                            )
                            const likeData = await response.json()
                            if (likeData.liked) {
                                likedSet.add(postId)
                            }
                        } catch (err) {
                            console.error('いいね状態取得エラー:', err)
                        }
                    })
                )

                setLikedPosts(likedSet)
            }
        } catch (err) {
            console.error('投稿取得エラー:', err)
            setError(err instanceof Error ? err.message : '投稿の取得に失敗しました')
        } finally {
            setIsLoading(false)
        }
    }

    // 講義情報を取得
    const fetchLectureInfo = async () => {
        try {
            const response = await fetch(`/api/lectures/${lectureId}`)
            const data = await response.json()

            if (response.ok) {
                setLectureInfo(data)
            }
        } catch (err) {
            console.error('講義情報取得エラー:', err)
        }
    }

    // 講義状態を取得
    const fetchLectureStatus = async () => {
        try {
            const response = await fetch(`/api/lectures/${lectureId}/status`)
            const data = await response.json()

            if (response.ok) {
                setIsLectureOpen(data.is_open)
                setRemainingMinutes(data.remaining_minutes)
            }
        } catch (err) {
            console.error('講義状態取得エラー:', err)
        }
    }

    // 初回読み込み時とソート変更時に投稿を取得
    useEffect(() => {
        if (lectureId) {
            fetchLectureInfo()
            fetchPosts()
            fetchLectureStatus()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [lectureId, sort])

    // 講義状態を定期的に確認（30秒ごと）
    useEffect(() => {
        if (!lectureId) return

        const interval = setInterval(() => {
            fetchLectureStatus()
        }, 30000) // 30秒ごと

        return () => clearInterval(interval)
    }, [lectureId])

    // リアルタイム同期（Supabase Realtime）
    useEffect(() => {
        if (!lectureId) return

        console.log('Setting up realtime subscription for lecture:', lectureId)

        // 投稿の変更を監視
        const channel = supabase
            .channel(`posts:${lectureId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'posts',
                    filter: `lecture_id=eq.${lectureId}`,
                },
                (payload) => {
                    console.log('Realtime event received:', payload.eventType, payload)
                    
                    // 新しい投稿が追加された場合
                    if (payload.eventType === 'INSERT') {
                        const newPost = payload.new as Post
                        // 削除されていない投稿のみ追加
                        if (!newPost.deleted_at) {
                            setPosts((prevPosts) => {
                                // 既に存在する場合は追加しない（重複防止）
                                if (prevPosts.some((p) => p.id === newPost.id)) {
                                    console.log('Post already exists, skipping:', newPost.id)
                                    return prevPosts
                                }
                                console.log('Adding new post to timeline:', newPost.id)
                                // ソート順に応じて適切な位置に挿入
                                // 新着順の場合は先頭に追加
                                return [newPost, ...prevPosts]
                            })
                        }
                    }
                    // 投稿が更新された場合（いいね数など）
                    else if (payload.eventType === 'UPDATE') {
                        const updatedPost = payload.new as Post
                        // 削除された投稿は除外
                        if (updatedPost.deleted_at) {
                            setPosts((prevPosts) => prevPosts.filter((p) => p.id !== updatedPost.id))
                        } else {
                            setPosts((prevPosts) => {
                                const index = prevPosts.findIndex((p) => p.id === updatedPost.id)
                                if (index !== -1) {
                                    // 既存の投稿を更新
                                    const newPosts = [...prevPosts]
                                    newPosts[index] = updatedPost
                                    return newPosts
                                } else {
                                    // 投稿が見つからない場合は追加（まれなケース）
                                    return [updatedPost, ...prevPosts]
                                }
                            })
                        }
                    }
                    // 投稿が削除された場合
                    else if (payload.eventType === 'DELETE') {
                        const deletedPostId = payload.old.id
                        setPosts((prevPosts) => prevPosts.filter((p) => p.id !== deletedPostId))
                    }
                }
            )
            .subscribe((status) => {
                console.log('Realtime subscription status:', status)
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to realtime updates')
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('Failed to subscribe to realtime updates')
                } else if (status === 'TIMED_OUT') {
                    console.error('Realtime subscription timed out')
                } else if (status === 'CLOSED') {
                    console.log('Realtime subscription closed')
                }
            })

        // クリーンアップ
        return () => {
            console.log('Cleaning up realtime subscription')
            supabase.removeChannel(channel)
        }
    }, [lectureId])

    // ソート順が変更された時に投稿を再ソート
    useEffect(() => {
        setPosts((prevPosts) => {
            const sorted = [...prevPosts]
            if (sort === 'newest') {
                sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            } else if (sort === 'popular') {
                sorted.sort((a, b) => {
                    if (b.like_count !== a.like_count) {
                        return b.like_count - a.like_count
                    }
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                })
            }
            return sorted
        })
    }, [sort])

    // 投稿を送信
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!isLectureOpen) {
            setError('この講義は投稿受付を終了しました')
            return
        }

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

            // リアルタイム同期で自動的に反映されるため、再取得は不要
            // ただし、ソート順が人気順の場合は再取得が必要
            if (sort === 'popular') {
                await fetchPosts()
            }
        } catch (err) {
            console.error('投稿エラー:', err)
            setError(err instanceof Error ? err.message : '投稿の作成に失敗しました')
        } finally {
            setIsSubmitting(false)
        }
    }

    // いいねをトグル
    const handleLike = async (postId: string) => {
        if (likingPosts.has(postId)) return // 既に処理中

        setLikingPosts((prev) => new Set(prev).add(postId))

        try {
            const response = await fetch('/api/likes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    post_id: postId,
                    user_identifier: userIdentifier,
                }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.error || 'いいねの処理に失敗しました')
            }

            // いいね状態を更新
            setLikedPosts((prev) => {
                const newSet = new Set(prev)
                if (data.liked) {
                    newSet.add(postId)
                } else {
                    newSet.delete(postId)
                }
                return newSet
            })

            // 投稿のいいね数を更新
            setPosts((prevPosts) => {
                const updatedPosts = prevPosts.map((post) => {
                    if (post.id === postId) {
                        return {
                            ...post,
                            like_count: data.liked ? post.like_count + 1 : Math.max(0, post.like_count - 1),
                        }
                    }
                    return post
                })

                // 人気順の場合は再ソート
                if (sort === 'popular') {
                    updatedPosts.sort((a, b) => {
                        if (b.like_count !== a.like_count) {
                            return b.like_count - a.like_count
                        }
                        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    })
                }

                return updatedPosts
            })
        } catch (err) {
            console.error('いいねエラー:', err)
            // エラーは静かに処理（ユーザーには通知しない）
        } finally {
            setLikingPosts((prev) => {
                const newSet = new Set(prev)
                newSet.delete(postId)
                return newSet
            })
        }
    }

    // 日時をフォーマット（タイムゾーン対応）
    const formatDateTime = (dateString: string) => {
        // ISO 8601形式の文字列をDateオブジェクトに変換
        // Supabaseから返されるTIMESTAMPTZはISO 8601形式（例: "2024-01-01T12:00:00+09:00"）
        const date = new Date(dateString)
        
        // 無効な日付の場合はエラーを返す
        if (isNaN(date.getTime())) {
            console.error('Invalid date string:', dateString)
            return '日時不明'
        }

        // 現在時刻を取得（ローカルタイムゾーン）
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)

        // 相対時間で表示
        if (minutes < 1) {
            return 'たった今'
        } else if (minutes < 60) {
            return `${minutes}分前`
        } else if (minutes < 1440) {
            const hours = Math.floor(minutes / 60)
            return `${hours}時間前`
        } else {
            // 1日以上前の場合は絶対時刻で表示（日本時間）
            return date.toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'Asia/Tokyo',
            })
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* ヘッダー */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            {lectureInfo?.course ? (
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {lectureInfo.course.code} - {lectureInfo.course.title}
                                    </h1>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        第{lectureInfo.lecture.session_number}回
                                    </p>
                                </div>
                            ) : (
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                    講義ページ
                                </h1>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            {!isLectureOpen && (
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full text-sm font-medium">
                                    投稿受付終了
                                </span>
                            )}
                            {isLectureOpen && remainingMinutes !== null && remainingMinutes <= 15 && (
                                <span className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full text-sm font-medium">
                                    あと{remainingMinutes}分
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {isLectureOpen
                                ? '匿名で質問や意見を投稿できます（終了時刻から15分後まで投稿可能）'
                                : 'この講義は投稿受付を終了しました'}
                        </p>
                        {!isLectureOpen && lectureInfo?.lecture.status === 'summarized' && (
                            <a
                                href={`/lecture/${lectureId}/summary`}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-sm"
                            >
                                要約を表示
                            </a>
                        )}
                    </div>
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
                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                                rows={4}
                                maxLength={maxLength}
                                disabled={isSubmitting || !isLectureOpen}
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
                            disabled={isSubmitting || !isLectureOpen || !content.trim() || content.length > maxLength}
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
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${sort === 'newest'
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                                }`}
                        >
                            新着順
                        </button>
                        <button
                            onClick={() => setSort('popular')}
                            className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${sort === 'popular'
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
                                    <button
                                        onClick={() => handleLike(post.id)}
                                        disabled={likingPosts.has(post.id)}
                                        className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${likedPosts.has(post.id)
                                            ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        <svg
                                            className={`w-4 h-4 ${likedPosts.has(post.id) ? 'fill-current' : ''}`}
                                            fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
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
                                        <span>{post.like_count}</span>
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}
