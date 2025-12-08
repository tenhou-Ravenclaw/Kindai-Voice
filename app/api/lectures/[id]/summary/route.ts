import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * 講義の要約を取得するAPI
 * GET /api/lectures/[id]/summary
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

    // 要約情報を取得
    const { data: summary, error: summaryError } = await supabase
      .from('summaries')
      .select('*')
      .eq('lecture_id', lectureId)
      .single()

    if (summaryError || !summary) {
      return NextResponse.json(
        { error: '要約が見つかりませんでした' },
        { status: 404 }
      )
    }

    // 講義情報も取得
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(`
        id,
        session_number,
        status,
        courses (
          id,
          code,
          title
        )
      `)
      .eq('id', lectureId)
      .single()

    return NextResponse.json({
      summary: {
        id: summary.id,
        lecture_id: summary.lecture_id,
        summary_text: summary.summary_text,
        total_posts_count: summary.total_posts_count,
        total_likes_count: summary.total_likes_count,
        created_at: summary.created_at,
      },
      lecture: lecture
        ? {
            id: lecture.id,
            session_number: lecture.session_number,
            status: lecture.status,
            course: (() => {
              const course = Array.isArray(lecture.courses)
                ? lecture.courses[0] || null
                : lecture.courses || null
              return course
                ? {
                    id: course.id,
                    code: course.code,
                    title: course.title,
                  }
                : null
            })(),
          }
        : null,
    })
  } catch (error) {
    console.error('要約取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

