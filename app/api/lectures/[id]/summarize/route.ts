import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 認証チェック
async function checkAuth(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (!authHeader) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token)

  if (error || !user) {
    return null
  }

  return user
}

/**
 * 講義のAI要約を生成するAPI
 * POST /api/lectures/[id]/summarize
 * 
 * 機能:
 * - 講義の全投稿データを取得
 * - OpenAI API（gpt-4o-mini）に送信
 * - 「主要な論点」「学生の関心事項」を要約
 * - summariesテーブルに保存
 * 
 * ⚠️ 認証必須: 管理者のみが実行可能
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // 認証チェック
    const user = await checkAuth(request)
    if (!user) {
      return NextResponse.json(
        { error: '認証が必要です' },
        { status: 401 }
      )
    }

    const resolvedParams = await Promise.resolve(params)
    const lectureId = resolvedParams.id

    if (!lectureId) {
      return NextResponse.json(
        { error: '講義IDが指定されていません' },
        { status: 400 }
      )
    }

    // OpenAI APIキーの確認
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI APIキーが設定されていません' },
        { status: 500 }
      )
    }

    const supabaseAdmin = getSupabaseAdmin()

    // 講義情報を取得
    const { data: lecture, error: lectureError } = await supabaseAdmin
      .from('lectures')
      .select('id, status, course_id')
      .eq('id', lectureId)
      .single()

    if (lectureError || !lecture) {
      return NextResponse.json(
        { error: '講義が見つかりませんでした' },
        { status: 404 }
      )
    }

    // 講義が終了しているか確認
    if (lecture.status !== 'ended') {
      return NextResponse.json(
        { error: '講義が終了していません。要約は終了した講義のみ生成できます。' },
        { status: 400 }
      )
    }

    // 既に要約が存在するか確認
    const { data: existingSummary } = await supabaseAdmin
      .from('summaries')
      .select('id')
      .eq('lecture_id', lectureId)
      .single()

    if (existingSummary) {
      return NextResponse.json(
        { error: 'この講義の要約は既に生成されています' },
        { status: 400 }
      )
    }

    // 投稿データを取得（削除されていないもののみ）
    const { data: posts, error: postsError } = await supabaseAdmin
      .from('posts')
      .select('id, content, like_count, created_at')
      .eq('lecture_id', lectureId)
      .is('deleted_at', null)
      .order('like_count', { ascending: false })
      .order('created_at', { ascending: false })

    if (postsError) {
      console.error('投稿取得エラー:', postsError)
      return NextResponse.json(
        { error: '投稿データの取得に失敗しました' },
        { status: 500 }
      )
    }

    // いいねの総数を取得
    let totalLikesCount = 0
    if (posts && posts.length > 0) {
      const postIds = posts.map((p) => p.id)
      const { count, error: likesError } = await supabaseAdmin
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('post_id', postIds)

      if (!likesError && count !== null) {
        totalLikesCount = count
      }
    }

    const totalPostsCount = posts?.length || 0

    // 投稿がない場合は要約を生成しない
    if (totalPostsCount === 0) {
      return NextResponse.json(
        { error: '要約する投稿がありません' },
        { status: 400 }
      )
    }

    // 投稿内容を整理（いいね数が多い順に上位を優先）
    const topPosts = posts?.slice(0, 50) || [] // 上位50件に制限（トークン節約）
    const postsText = topPosts
      .map((post, index) => {
        return `[投稿${index + 1}] いいね数: ${post.like_count}\n${post.content}`
      })
      .join('\n\n')

    // OpenAI APIに送信するプロンプト
    const systemPrompt = `あなたは大学講義の学生の意見を分析する専門家です。
講義中に学生が投稿した匿名の質問や意見を分析し、以下の観点から要約してください：

1. **主要な論点**: 学生が最も関心を持っているトピックや議論のポイント
2. **学生の関心事項**: 学生が質問や意見として挙げた具体的な内容
3. **全体の傾向**: 投稿全体から見える学生の理解度や関心の方向性

要約は簡潔で分かりやすく、講義担当者が学生の理解度や関心事を把握できるようにしてください。
日本語で回答してください。`

    const userPrompt = `以下の講義中の学生投稿を分析して要約してください：

総投稿数: ${totalPostsCount}件
総いいね数: ${totalLikesCount}件

【投稿内容】
${postsText}

上記の投稿を分析し、主要な論点、学生の関心事項、全体の傾向を要約してください。`

    // OpenAI APIを呼び出し
    let summaryText: string
    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      summaryText = completion.choices[0]?.message?.content || '要約の生成に失敗しました'
    } catch (openaiError: any) {
      console.error('OpenAI APIエラー:', openaiError)
      return NextResponse.json(
        {
          error: 'AI要約の生成に失敗しました',
          details: openaiError.message || 'Unknown error',
        },
        { status: 500 }
      )
    }

    // summariesテーブルに保存
    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('summaries')
      .insert({
        lecture_id: lectureId,
        summary_text: summaryText,
        total_posts_count: totalPostsCount,
        total_likes_count: totalLikesCount,
      })
      .select()
      .single()

    if (summaryError) {
      console.error('要約保存エラー:', summaryError)
      return NextResponse.json(
        { error: '要約の保存に失敗しました' },
        { status: 500 }
      )
    }

    // 講義のステータスを'summarized'に更新
    const { error: updateError } = await supabaseAdmin
      .from('lectures')
      .update({ status: 'summarized' })
      .eq('id', lectureId)

    if (updateError) {
      console.error('講義ステータス更新エラー:', updateError)
      // 要約は保存されているので、エラーを返さずに続行
    }

    return NextResponse.json({
      summary: {
        id: summary.id,
        lecture_id: summary.lecture_id,
        summary_text: summary.summary_text,
        total_posts_count: summary.total_posts_count,
        total_likes_count: summary.total_likes_count,
        created_at: summary.created_at,
      },
      message: '要約が正常に生成されました',
    })
  } catch (error) {
    console.error('要約生成APIエラー:', error)
    return NextResponse.json(
      { error: 'サーバーエラーが発生しました' },
      { status: 500 }
    )
  }
}

