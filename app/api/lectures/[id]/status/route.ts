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
 * 講義の状態を取得するAPI
 * GET /api/lectures/[id]/status
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

    // 講義情報を取得
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select('id, status, scheduled_end_time')
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: '講義が見つかりませんでした' },
        { status: 404 }
      )
    }

    const now = new Date()
    const endTime = lecture.scheduled_end_time ? new Date(lecture.scheduled_end_time) : null
    const gracePeriodMinutes = 15 // 15分の猶予期間
    const gracePeriodEndTime = endTime
      ? new Date(endTime.getTime() + gracePeriodMinutes * 60 * 1000)
      : null

    // 講義が投稿可能かどうかを判定
    let isOpen = false
    let remainingMinutes: number | null = null

    if (lecture.status === 'active') {
      if (gracePeriodEndTime && now < gracePeriodEndTime) {
        isOpen = true
        remainingMinutes = Math.max(0, Math.ceil((gracePeriodEndTime.getTime() - now.getTime()) / 60000))
      } else if (!gracePeriodEndTime) {
        // 終了時刻が設定されていない場合は常にオープン
        isOpen = true
      }
    }

    return NextResponse.json({
      lecture_id: lecture.id,
      status: lecture.status,
      is_open: isOpen,
      remaining_minutes: remainingMinutes,
      scheduled_end_time: lecture.scheduled_end_time,
      grace_period_end_time: gracePeriodEndTime?.toISOString() || null,
      debug: {
        current_time: now.toISOString(),
        end_time: endTime?.toISOString() || null,
        grace_period_end_time: gracePeriodEndTime?.toISOString() || null,
        is_before: gracePeriodEndTime ? now < gracePeriodEndTime : null,
      },
    })
  } catch (error) {
    console.error('講義状態取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

