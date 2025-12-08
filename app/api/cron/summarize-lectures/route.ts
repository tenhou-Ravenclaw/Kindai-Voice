import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * 講義の自動要約処理
 * Vercel Cronから定期実行される
 * 
 * 機能:
 * - status = 'ended'の講義を取得
 * - 講義終了から一定時間（例：1時間）経過後、自動的に要約処理を実行
 * - 要約生成APIを呼び出し
 */
export async function GET(request: NextRequest) {
  try {
    // Vercel Cronからのリクエストか確認（オプション）
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

    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    const now = new Date()
    const delayHours = 1 // 講義終了から1時間後に要約を生成
    const delayMs = delayHours * 60 * 60 * 1000

    // status = 'ended'の講義を取得
    const { data: endedLectures, error: fetchError } = await supabaseAdmin
      .from('lectures')
      .select('id, scheduled_end_time, updated_at')
      .eq('status', 'ended')

    if (fetchError) {
      console.error('講義取得エラー:', fetchError)
      return NextResponse.json(
        { error: '講義の取得に失敗しました' },
        { status: 500 }
      )
    }

    if (!endedLectures || endedLectures.length === 0) {
      return NextResponse.json({
        message: '要約すべき講義はありません',
        checked_at: now.toISOString(),
        processed_count: 0,
      })
    }

    // 既に要約が存在する講義を除外
    const { data: existingSummaries } = await supabaseAdmin
      .from('summaries')
      .select('lecture_id')

    const summarizedLectureIds = new Set(
      existingSummaries?.map((s) => s.lecture_id) || []
    )

    // 終了時刻から一定時間経過した講義をフィルタリング
    const lecturesToSummarize = endedLectures.filter((lecture) => {
      // 既に要約済みの場合はスキップ
      if (summarizedLectureIds.has(lecture.id)) {
        return false
      }

      // updated_at（終了時刻）から一定時間経過しているか確認
      const endTime = lecture.updated_at
        ? new Date(lecture.updated_at)
        : lecture.scheduled_end_time
        ? new Date(lecture.scheduled_end_time)
        : null

      if (!endTime) {
        return false // 終了時刻が不明な場合はスキップ
      }

      const elapsed = now.getTime() - endTime.getTime()
      return elapsed >= delayMs
    })

    if (lecturesToSummarize.length === 0) {
      return NextResponse.json({
        message: '要約すべき講義はありません（まだ時間が経過していないか、既に要約済み）',
        checked_at: now.toISOString(),
        ended_lectures_count: endedLectures.length,
        processed_count: 0,
      })
    }

    // 各講義に対して要約を生成
    const results = []
    for (const lecture of lecturesToSummarize) {
      try {
        // 要約生成APIを呼び出し
        // Vercel環境では内部API呼び出し、ローカルではlocalhostを使用
        const baseUrl =
          process.env.VERCEL_URL && process.env.NODE_ENV === 'production'
            ? `https://${process.env.VERCEL_URL}`
            : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/lectures/${lecture.id}/summarize`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        const data = await response.json()

        if (response.ok) {
          results.push({
            lecture_id: lecture.id,
            status: 'success',
            summary_id: data.summary?.id,
          })
          console.log(`✅ 講義 ${lecture.id} の要約を生成しました`)
        } else {
          results.push({
            lecture_id: lecture.id,
            status: 'error',
            error: data.error || 'Unknown error',
          })
          console.error(`❌ 講義 ${lecture.id} の要約生成に失敗:`, data.error)
        }
      } catch (error: any) {
        results.push({
          lecture_id: lecture.id,
          status: 'error',
          error: error.message || 'Unknown error',
        })
        console.error(`❌ 講義 ${lecture.id} の要約生成エラー:`, error)
      }
    }

    const successCount = results.filter((r) => r.status === 'success').length
    const errorCount = results.filter((r) => r.status === 'error').length

    return NextResponse.json({
      message: '講義の自動要約処理が完了しました',
      checked_at: now.toISOString(),
      ended_lectures_count: endedLectures.length,
      processed_count: lecturesToSummarize.length,
      success_count: successCount,
      error_count: errorCount,
      results,
    })
  } catch (error) {
    console.error('自動要約処理エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

// POSTメソッドもサポート
export async function POST(request: NextRequest) {
  return GET(request)
}

