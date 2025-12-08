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
 * 講義セッション一覧を取得
 * GET /api/admin/lectures
 */
export async function GET(request: NextRequest) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const courseId = searchParams.get('course_id')
    const status = searchParams.get('status')

    let query = supabaseAdmin
      .from('lectures')
      .select(`
        *,
        courses (
          id,
          code,
          title
        )
      `)
      .order('created_at', { ascending: false })

    if (courseId) {
      query = query.eq('course_id', courseId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const { data: lectures, error } = await query

    if (error) {
      console.error('講義セッション取得エラー:', error)
      return NextResponse.json(
        { error: '講義セッションの取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lectures: lectures || [] })
  } catch (error) {
    console.error('講義セッション取得APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * 講義セッションを作成
 * POST /api/admin/lectures
 */
export async function POST(request: NextRequest) {
  try {
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 })
    }

    const body = await request.json()
    const {
      course_id,
      session_number,
      status,
      scheduled_start_time,
      scheduled_end_time,
      is_rescheduled,
    } = body

    // バリデーション
    if (!course_id || !session_number) {
      return NextResponse.json(
        { error: 'コースIDと回数は必須です' },
        { status: 400 }
      )
    }

    if (session_number < 1 || session_number > 15) {
      return NextResponse.json(
        { error: '回数は1〜15の範囲で指定してください' },
        { status: 400 }
      )
    }

    const { data: lecture, error } = await supabaseAdmin
      .from('lectures')
      .insert({
        course_id,
        session_number,
        status: status || 'scheduled',
        scheduled_start_time: scheduled_start_time || null,
        scheduled_end_time: scheduled_end_time || null,
        is_rescheduled: is_rescheduled || false,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'このコースのこの回数は既に存在します' },
          { status: 400 }
        )
      }
      console.error('講義セッション作成エラー:', error)
      return NextResponse.json(
        { error: '講義セッションの作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lecture }, { status: 201 })
  } catch (error) {
    console.error('講義セッション作成APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}
