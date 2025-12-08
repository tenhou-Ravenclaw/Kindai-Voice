import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

/**
 * サーバーサイドでSupabaseクライアントを作成（認証用）
 * Cookieからセッションを読み取る
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // サーバーコンポーネントではCookieの設定ができない場合がある
            // この場合はクライアントサイドで設定される
            console.error('Error setting cookies in setAll:', error);
          }
        },
      },
    }
  )
}

