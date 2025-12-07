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
 * 講義の投稿一覧を取得するAPI
 * GET /api/posts/[lecture_id]?sort=popular|newest
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lecture_id: string }> | { lecture_id: string } }
) {
  try {
    // Next.js 15+ではparamsがPromiseの場合があるため、awaitで解決
    const resolvedParams = await Promise.resolve(params)
    const lectureId = resolvedParams.lecture_id
    const searchParams = request.nextUrl.searchParams
    const sort = searchParams.get('sort') || 'newest' // デフォルトは新着順

    if (!lectureId) {
      return NextResponse.json(
        { error: '講義IDが指定されていません' },
        { status: 400 }
      )
    }

    // ソート順を決定
    let orderBy: { column: string; ascending: boolean }[]
    if (sort === 'popular') {
      orderBy = [
        { column: 'like_count', ascending: false },
        { column: 'created_at', ascending: false }
      ]
    } else {
      orderBy = [{ column: 'created_at', ascending: false }]
    }

    // 投稿を取得
    let query = supabase
      .from('posts')
      .select('*')
      .eq('lecture_id', lectureId)
      .is('deleted_at', null)

    // ソートを適用
    for (const order of orderBy) {
      query = query.order(order.column, { ascending: order.ascending })
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('投稿取得エラー:', error)
      return NextResponse.json(
        { error: '投稿の取得に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('投稿取得APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

