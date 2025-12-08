'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAuth } from '@/lib/supabase/auth-client'
import Link from 'next/link'

export default function AdminPage() {
    const router = useRouter()
    const [user, setUser] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        // レイアウトで認証チェックを行っているため、ここではユーザー情報のみ取得
        const loadUser = async () => {
            const {
                data: { session },
            } = await supabaseAuth.auth.getSession()

            if (session) {
                setUser(session.user)
            }
            setIsLoading(false)
        }

        loadUser()

        // 認証状態の変更を監視（ログアウト時の処理）
        const {
            data: { subscription },
        } = supabaseAuth.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                router.push('/login')
            } else {
                setUser(session.user)
            }
        })

        return () => {
            subscription.unsubscribe()
        }
    }, [router])

    const handleLogout = async () => {
        await supabaseAuth.auth.signOut()
        router.push('/login')
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
                {/* ヘッダー */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                                管理画面
                            </h1>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                ログイン中: {user?.email}
                            </p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                        >
                            ログアウト
                        </button>
                    </div>
                </div>

                {/* メニュー */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <Link
                        href="/admin/courses"
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            コース管理
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            講義コースの作成・編集・削除
                        </p>
                    </Link>

                    <Link
                        href="/admin/lectures"
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            講義セッション管理
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            講義セッションの作成・編集・削除
                        </p>
                    </Link>

                    <Link
                        href="/admin/lectures/end"
                        className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
                    >
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                            講義終了管理
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            講義の終了処理とデータ削除
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    )
}

