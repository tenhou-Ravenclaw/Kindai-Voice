import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 認証チェック
async function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}

/**
 * 講義セッションを更新
 * PUT /api/admin/lectures/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const lectureId = resolvedParams.id

    const body = await request.json()
    const {
      status,
      scheduled_start_time,
      scheduled_end_time,
      is_rescheduled,
    } = body

    const { data: lecture, error } = await supabaseAdmin
      .from('lectures')
      .update({
        status: status || undefined,
        scheduled_start_time: scheduled_start_time !== undefined ? scheduled_start_time : undefined,
        scheduled_end_time: scheduled_end_time !== undefined ? scheduled_end_time : undefined,
        is_rescheduled: is_rescheduled !== undefined ? is_rescheduled : undefined,
      })
      .eq('id', lectureId)
      .select()
      .single()

    if (error) {
      console.error('講義セッション更新エラー:', error)
      return NextResponse.json(
        { error: '講義セッションの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lecture })
  } catch (error) {
    console.error('講義セッション更新APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 講義セッションを削除
 * DELETE /api/admin/lectures/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const lectureId = resolvedParams.id

    const { error } = await supabaseAdmin
      .from('lectures')
      .delete()
      .eq('id', lectureId)

    if (error) {
      console.error('講義セッション削除エラー:', error)
      return NextResponse.json(
        { error: '講義セッションの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: '講義セッションを削除しました' })
  } catch (error) {
    console.error('講義セッション削除APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
