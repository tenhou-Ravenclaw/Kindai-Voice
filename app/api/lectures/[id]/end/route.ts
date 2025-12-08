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
 * 講義を終了するAPI（手動終了）
 * POST /api/lectures/[id]/end
 */
export async function POST(
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
      .select('id, status')
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: '講義が見つかりませんでした' },
        { status: 404 }
      )
    }

    if (lecture.status !== 'active') {
      return NextResponse.json(
        { error: 'この講義は既に終了しています' },
        { status: 400 }
      )
    }

    // 講義を終了状態に更新
    const { data: updatedLecture, error: updateError } = await supabase
      .from('lectures')
      .update({ status: 'ended' })
      .eq('id', lectureId)
      .select()
      .single()

    if (updateError) {
      console.error('講義終了エラー:', updateError)
      return NextResponse.json(
        { error: '講義の終了処理に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      lecture_id: updatedLecture.id,
      status: updatedLecture.status,
      message: '講義を終了しました',
    })
  } catch (error) {
    console.error('講義終了APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

