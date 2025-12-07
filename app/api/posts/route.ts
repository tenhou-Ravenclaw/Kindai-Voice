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
 * 投稿を作成するAPI
 * POST /api/posts
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { lecture_id, content } = body

    // バリデーション
    if (!lecture_id) {
      return NextResponse.json(
        { error: '講義IDが指定されていません' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { error: '投稿内容が指定されていません' },
        { status: 400 }
      )
    }

    const trimmedContent = content.trim()

    if (trimmedContent.length === 0) {
      return NextResponse.json(
        { error: '投稿内容が空です' },
        { status: 400 }
      )
    }

    if (trimmedContent.length > 200) {
      return NextResponse.json(
        { error: '投稿内容は200文字以内で入力してください' },
        { status: 400 }
      )
    }

    // 講義が開催中か確認
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select('id, status')
      .eq('id', lecture_id)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: '講義が見つかりませんでした' },
        { status: 404 }
      )
    }

    if (lecture.status !== 'active') {
      return NextResponse.json(
        { error: 'この講義は現在開催されていません' },
        { status: 403 }
      )
    }

    // 投稿を作成
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        lecture_id,
        content: trimmedContent,
        like_count: 0
      })
      .select()
      .single()

    if (postError) {
      console.error('投稿作成エラー:', postError)
      return NextResponse.json(
        { error: '投稿の作成に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ post }, { status: 201 })
  } catch (error) {
    console.error('投稿APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

