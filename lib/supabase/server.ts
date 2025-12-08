import { createClient } from '@supabase/supabase-js'

// サーバーサイド用（Service Role Keyを使用）
// Phase 3のAI要約・削除処理など、管理者権限が必要な操作で使用
export function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file:\n' +
      '  - NEXT_PUBLIC_SUPABASE_URL\n' +
      '  - SUPABASE_SERVICE_ROLE_KEY\n\n' +
      'Make sure to restart the development server after updating .env.local'
    )
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// 後方互換性のため（既存コードで使用されている）
// 注意: このエクスポートは非推奨です。新しいコードでは getSupabaseAdmin() を使用してください
// モジュール読み込み時にエラーを避けるため、遅延評価にしています
let _supabaseAdminInstance: ReturnType<typeof getSupabaseAdmin> | null = null

export const supabaseAdmin = new Proxy({} as ReturnType<typeof getSupabaseAdmin>, {
  get(_target, prop) {
    if (!_supabaseAdminInstance) {
      _supabaseAdminInstance = getSupabaseAdmin()
    }
    return (_supabaseAdminInstance as any)[prop]
  }
})

