import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 講義情報を取得するAPI
 * GET /api/lectures/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params)
    const lectureId = resolvedParams.id

    if (!lectureId) {
      return NextResponse.json(
        { error: '講義IDが指定されていません' },
        { status: 400 }
      )
    }

    // 講義情報とコース情報を取得
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(`
        id,
        course_id,
        session_number,
        status,
        scheduled_start_time,
        scheduled_end_time,
        is_rescheduled,
        courses (
          id,
          code,
          title
        )
      `)
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: '講義が見つかりませんでした' },
        { status: 404 }
      )
    }

    // coursesはリレーションシップなので、配列または単一オブジェクトの可能性がある
    const course = Array.isArray(lecture.courses)
      ? lecture.courses[0] || null
      : lecture.courses || null

    return NextResponse.json({
      lecture: {
        id: lecture.id,
        course_id: lecture.course_id,
        session_number: lecture.session_number,
        status: lecture.status,
        scheduled_start_time: lecture.scheduled_start_time,
        scheduled_end_time: lecture.scheduled_end_time,
        is_rescheduled: lecture.is_rescheduled,
      },
      course: course
        ? {
            id: course.id,
            code: course.code,
            title: course.title,
          }
        : null,
    })
  } catch (error) {
    console.error('講義情報取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

