import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// サーバーサイド用のSupabaseクライアント
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 講義コードで講義を検索するAPI
 * GET /api/lectures/search?code=XXXXX
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json(
        { error: '講義コードが指定されていません' },
        { status: 400 }
      )
    }

    // 講義コードでコースを検索
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('id, code, title')
      .eq('code', code.toUpperCase())
      .single()

    if (courseError || !course) {
      return NextResponse.json(
        { error: '講義が見つかりませんでした' },
        { status: 404 }
      )
    }

    // 開催中の講義セッションを検索（最新のものを取得）
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select('id, course_id, session_number, status, scheduled_start_time, scheduled_end_time')
      .eq('course_id', course.id)
      .eq('status', 'active')
      .order('session_number', { ascending: false })
      .limit(1)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { 
          error: '開催中の講義が見つかりませんでした',
          course: {
            id: course.id,
            code: course.code,
            title: course.title
          }
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      course: {
        id: course.id,
        code: course.code,
        title: course.title
      },
      lecture: {
        id: lecture.id,
        session_number: lecture.session_number,
        scheduled_start_time: lecture.scheduled_start_time,
        scheduled_end_time: lecture.scheduled_end_time
      }
    })
  } catch (error) {
    console.error('講義検索エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

