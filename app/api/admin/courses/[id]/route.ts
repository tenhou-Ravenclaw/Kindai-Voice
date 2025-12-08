import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdmin } from '@/lib/supabase/server'

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
 * コースを更新
 * PUT /api/admin/courses/[id]
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
    const courseId = resolvedParams.id

    const supabaseAdmin = getSupabaseAdmin()
    const body = await request.json()
    const {
      code,
      title,
      total_sessions,
      regular_day_of_week,
      regular_start_time,
      regular_end_time,
      first_session_date,
    } = body

    // バリデーション
    if (!code || !title) {
      return NextResponse.json(
        { error: '講義コードとタイトルは必須です' },
        { status: 400 }
      )
    }

    const { data: course, error } = await supabaseAdmin
      .from('courses')
      .update({
        code: code.toUpperCase(),
        title,
        total_sessions: total_sessions || 15,
        regular_day_of_week: regular_day_of_week || null,
        regular_start_time: regular_start_time || null,
        regular_end_time: regular_end_time || null,
        first_session_date: first_session_date || null,
      })
      .eq('id', courseId)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'この講義コードは既に使用されています' },
          { status: 400 }
        )
      }
      console.error('コース更新エラー:', error)
      return NextResponse.json(
        { error: 'コースの更新に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ course })
  } catch (error) {
    console.error('コース更新APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * コースを削除
 * DELETE /api/admin/courses/[id]
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
    const courseId = resolvedParams.id

    const supabaseAdmin = getSupabaseAdmin()
    const { error } = await supabaseAdmin
      .from('courses')
      .delete()
      .eq('id', courseId)

    if (error) {
      console.error('コース削除エラー:', error)
      return NextResponse.json(
        { error: 'コースの削除に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'コースを削除しました' })
  } catch (error) {
    console.error('コース削除APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

