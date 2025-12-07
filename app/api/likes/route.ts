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
 * いいねを追加/削除するAPI
 * POST /api/likes
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { post_id, user_identifier } = body

    // バリデーション
    if (!post_id) {
      return NextResponse.json(
        { error: '投稿IDが指定されていません' },
        { status: 400 }
      )
    }

    if (!user_identifier) {
      return NextResponse.json(
        { error: 'ユーザー識別子が指定されていません' },
        { status: 400 }
      )
    }

    // 既にいいねが存在するか確認
    const { data: existingLike, error: checkError } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116は「データが見つからない」エラー（正常）
      console.error('いいね確認エラー:', checkError)
      return NextResponse.json(
        { error: 'いいねの確認に失敗しました' },
        { status: 500 }
      )
    }

    // 既にいいねが存在する場合は削除（トグル動作）
    if (existingLike) {
      // いいねを削除
      const { error: deleteError } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id)

      if (deleteError) {
        console.error('いいね削除エラー:', deleteError)
        return NextResponse.json(
          { error: 'いいねの削除に失敗しました' },
          { status: 500 }
        )
      }

      // 投稿のいいね数を減らす
      const { error: updateError } = await supabase.rpc('decrement_like_count', {
        post_id_param: post_id,
      })

      // RPC関数が存在しない場合は直接更新
      if (updateError) {
        const { data: post } = await supabase
          .from('posts')
          .select('like_count')
          .eq('id', post_id)
          .single()

        if (post) {
          await supabase
            .from('posts')
            .update({ like_count: Math.max(0, post.like_count - 1) })
            .eq('id', post_id)
        }
      }

      return NextResponse.json({ liked: false })
    } else {
      // いいねを追加
      const { data: like, error: insertError } = await supabase
        .from('likes')
        .insert({
          post_id,
          user_identifier,
        })
        .select()
        .single()

      if (insertError) {
        // 重複エラーの場合（同時に複数回クリックされた場合など）
        if (insertError.code === '23505') {
          return NextResponse.json({ liked: true })
        }
        console.error('いいね追加エラー:', insertError)
        return NextResponse.json(
          { error: 'いいねの追加に失敗しました' },
          { status: 500 }
        )
      }

      // 投稿のいいね数を増やす
      const { error: updateError } = await supabase.rpc('increment_like_count', {
        post_id_param: post_id,
      })

      // RPC関数が存在しない場合は直接更新
      if (updateError) {
        const { data: post } = await supabase
          .from('posts')
          .select('like_count')
          .eq('id', post_id)
          .single()

        if (post) {
          await supabase
            .from('posts')
            .update({ like_count: post.like_count + 1 })
            .eq('id', post_id)
        }
      }

      return NextResponse.json({ liked: true })
    }
  } catch (error) {
    console.error('いいねAPIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

/**
 * ユーザーがいいねした投稿を取得するAPI
 * GET /api/likes?post_id=XXX&user_identifier=YYY
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const post_id = searchParams.get('post_id')
    const user_identifier = searchParams.get('user_identifier')

    if (!post_id || !user_identifier) {
      return NextResponse.json(
        { error: '投稿IDまたはユーザー識別子が指定されていません' },
        { status: 400 }
      )
    }

    const { data: like, error } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', post_id)
      .eq('user_identifier', user_identifier)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json(
        { error: 'いいねの確認に失敗しました' },
        { status: 500 }
      )
    }

    return NextResponse.json({ liked: !!like })
  } catch (error) {
    console.error('いいね取得APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

