/**
 * ユーザー識別子を取得または生成する
 * LocalStorageにUUIDを保存して、同じブラウザでは同じ識別子を使用
 */
export function getUserIdentifier(): string {
  if (typeof window === 'undefined') {
    // サーバーサイドでは使用しない
    return ''
  }

  const STORAGE_KEY = 'kindai_voice_user_id'
  let userId = localStorage.getItem(STORAGE_KEY)

  if (!userId) {
    // UUIDを生成（簡易版）
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15)
    localStorage.setItem(STORAGE_KEY, userId)
  }

  return userId
}

