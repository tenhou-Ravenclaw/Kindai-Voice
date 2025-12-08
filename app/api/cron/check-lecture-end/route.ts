import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server'

/**
 * 講義の自動終了チェック
 * Vercel Cronから定期実行される
 * 
 * 機能:
 * - status = 'active'の講義を取得
 * - scheduled_end_timeをチェック
 * - 終了時刻を過ぎていたらstatus = 'ended'に更新
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cronからのリクエストか確認（オプション）
    // 本番環境では、Authorizationヘッダーまたは環境変数で検証することを推奨
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    // 本番環境では認証を必須にする（開発環境ではスキップ可能）
    if (process.env.NODE_ENV === 'production' && cronSecret) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // 現在時刻
    const now = new Date()

    // status = 'active'の講義を取得
    const { data: activeLectures, error: fetchError } = await supabaseAdmin
      .from('lectures')
      .select('id, scheduled_end_time, status')
      .eq('status', 'active')

    if (fetchError) {
      console.error('講義取得エラー:', fetchError)
      return NextResponse.json(
        { error: '講義の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!activeLectures || activeLectures.length === 0) {
      return NextResponse.json({
        message: '終了すべき講義はありません',
        checked_at: now.toISOString(),
        processed_count: 0,
      })
    }

    // 終了時刻を過ぎた講義をフィルタリング
    const lecturesToEnd = activeLectures.filter((lecture) => {
      if (!lecture.scheduled_end_time) {
        return false // 終了時刻が設定されていない場合はスキップ
      }
      const endTime = new Date(lecture.scheduled_end_time)
      return now >= endTime
    })

    if (lecturesToEnd.length === 0) {
      return NextResponse.json({
        message: '終了すべき講義はありません',
        checked_at: now.toISOString(),
        active_lectures_count: activeLectures.length,
        processed_count: 0,
      })
    }

    // 終了処理を実行
    const lectureIds = lecturesToEnd.map((l) => l.id)
    const { data: updatedLectures, error: updateError } = await supabaseAdmin
      .from('lectures')
      .update({ status: 'ended' })
      .in('id', lectureIds)
      .select('id, scheduled_end_time')

    if (updateError) {
      console.error('講義終了更新エラー:', updateError)
      return NextResponse.json(
        { error: '講義の終了処理に失敗しました' },
        { status: 500 }
      )
    }

    console.log(`✅ ${updatedLectures?.length || 0}件の講義を自動終了しました`)

    return NextResponse.json({
      message: '講義の自動終了処理が完了しました',
      checked_at: now.toISOString(),
      active_lectures_count: activeLectures.length,
      processed_count: updatedLectures?.length || 0,
      ended_lectures: updatedLectures?.map((l) => ({
        id: l.id,
        scheduled_end_time: l.scheduled_end_time,
      })),
    })
  } catch (error) {
    console.error('自動終了チェックエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// POSTメソッドもサポート（Vercel CronはGETを推奨）
export async function POST(request: NextRequest) {
  return GET(request)
}

