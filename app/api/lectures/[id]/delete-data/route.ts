import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'

/**
 * 講義の生データを物理削除するAPI
 * POST /api/lectures/[id]/delete-data
 * 
 * ⚠️ 注意: この操作は不可逆的です。削除されたデータは復元できません。
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
    const { data: lecture, error: lectureError } = await supabaseAdmin
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

    // 既に要約済みの場合は削除済みとみなす
    if (lecture.status === 'summarized') {
      return NextResponse.json(
        { 
          message: 'この講義のデータは既に削除されています',
          lecture_id: lecture.id,
          status: lecture.status
        },
        { status: 200 }
      )
    }

    // 講義が終了していない場合はエラー
    if (lecture.status !== 'ended') {
      return NextResponse.json(
        { error: '講義が終了していないため、データを削除できません' },
        { status: 400 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 削除前の統計情報を取得（ログ用）
    const { data: postsData, error: postsError } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('lecture_id', lectureId)

    const postsCount = postsData?.length || 0

    const { data: likesData, error: likesError } = await supabaseAdmin
      .from('likes')
      .select('id')
      .in('post_id', postsData?.map(p => p.id) || [])

    const likesCount = likesData?.length || 0

    console.log(`[削除開始] 講義ID: ${lectureId}, 投稿数: ${postsCount}, いいね数: ${likesCount}`)

    // 1. いいねデータを物理削除（外部キー制約により先に削除）
    if (postsData && postsData.length > 0) {
      const postIds = postsData.map(p => p.id)
      const { error: deleteLikesError } = await supabaseAdmin
        .from('likes')
        .delete()
        .in('post_id', postIds)

      if (deleteLikesError) {
        console.error('いいねデータ削除エラー:', deleteLikesError)
        return NextResponse.json(
          { error: 'いいねデータの削除に失敗しました', details: deleteLikesError.message },
          { status: 500 }
        )
      }
      console.log(`[削除完了] いいねデータ: ${likesCount}件`)
    }

    // 2. 投稿データを物理削除
    const { error: deletePostsError } = await supabaseAdmin
      .from('posts')
      .delete()
      .eq('lecture_id', lectureId)

    if (deletePostsError) {
      console.error('投稿データ削除エラー:', deletePostsError)
      return NextResponse.json(
        { error: '投稿データの削除に失敗しました', details: deletePostsError.message },
        { status: 500 }
      )
    }
    console.log(`[削除完了] 投稿データ: ${postsCount}件`)

    // 3. 講義ステータスを'summarized'に更新
    const { error: updateStatusError } = await supabaseAdmin
      .from('lectures')
      .update({ status: 'summarized' })
      .eq('id', lectureId)

    if (updateStatusError) {
      console.error('講義ステータス更新エラー:', updateStatusError)
      return NextResponse.json(
        { error: '講義ステータスの更新に失敗しました', details: updateStatusError.message },
        { status: 500 }
      )
    }
    console.log(`[更新完了] 講義ステータス: ended -> summarized`)

    return NextResponse.json({
      message: '生データの物理削除が完了しました',
      lecture_id: lectureId,
      deleted_posts_count: postsCount,
      deleted_likes_count: likesCount,
      status: 'summarized'
    })
  } catch (error) {
    console.error('生データ削除APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * 削除前の統計情報を取得するAPI
 * GET /api/lectures/[id]/delete-data
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

    const supabaseAdmin = getSupabaseAdmin()

    // 講義情報を取得
    const { data: lecture, error: lectureError } = await supabaseAdmin
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

    // 投稿数を取得
    const { count: postsCount, error: postsError } = await supabaseAdmin
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('lecture_id', lectureId)

    if (postsError) {
      console.error('投稿数取得エラー:', postsError)
    }

    // いいね数を取得
    const { data: postsData } = await supabaseAdmin
      .from('posts')
      .select('id')
      .eq('lecture_id', lectureId)

    let likesCount = 0
    if (postsData && postsData.length > 0) {
      const postIds = postsData.map(p => p.id)
      const { count, error: likesError } = await supabaseAdmin
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds)

      if (!likesError && count !== null) {
        likesCount = count
      }
    }

    return NextResponse.json({
      lecture_id: lectureId,
      status: lecture.status,
      posts_count: postsCount || 0,
      likes_count: likesCount,
      can_delete: lecture.status === 'ended',
      already_deleted: lecture.status === 'summarized'
    })
  } catch (error) {
    console.error('統計情報取得エラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

