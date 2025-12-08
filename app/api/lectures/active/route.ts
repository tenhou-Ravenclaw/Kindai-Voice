import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * アクティブな講義一覧を取得するAPI（認証不要）
 * GET /api/lectures/active
 */
export async function GET(request: NextRequest) {
  try {
    // アクティブな講義を取得（コース情報も含む）
    const { data: lectures, error } = await supabase
      .from('lectures')
      .select(`
        id,
        session_number,
        scheduled_start_time,
        scheduled_end_time,
        courses (
          id,
          code,
          title
        )
      `)
      .eq('status', 'active')
      .order('scheduled_start_time', { ascending: false })

    if (error) {
      console.error('講義取得エラー:', error)
      return NextResponse.json(
        { error: '講義の取得に失敗しました' },
        { status: 500 }
      )
    }

    // コース情報を整形
    const formattedLectures = (lectures || []).map((lecture) => {
      const course = Array.isArray(lecture.courses)
        ? lecture.courses[0] || null
        : lecture.courses || null

      return {
        id: lecture.id,
        session_number: lecture.session_number,
        scheduled_start_time: lecture.scheduled_start_time,
        scheduled_end_time: lecture.scheduled_end_time,
        course: course
          ? {
              id: course.id,
              code: course.code,
              title: course.title,
            }
          : null,
      }
    })

    return NextResponse.json({ lectures: formattedLectures })
  } catch (error) {
    console.error('アクティブ講義取得APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

