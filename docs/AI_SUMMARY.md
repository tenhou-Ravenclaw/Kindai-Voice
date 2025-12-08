# AI要約機能

## 概要

講義終了後のAI要約生成と生データの物理削除を行う機能です。Phase 3の核心機能です。

## 実装内容

### 1. AI要約生成API

**エンドポイント:** `POST /api/lectures/[id]/summarize`

**機能:**
- 講義の全投稿データを取得
- OpenAI API（`gpt-4o-mini`）に送信
- 「主要な論点」「学生の関心事項」を要約
- `summaries`テーブルに保存
- 講義のステータスを`'summarized'`に更新

**必要な環境変数:**
- `OPENAI_API_KEY` - OpenAI APIキー

**使用モデル:**
- `gpt-4o-mini` - コストと精度のバランスを重視

**プロンプト:**
- システムプロンプト: 大学講義の学生意見を分析する専門家として設定
- ユーザープロンプト: 投稿内容（上位50件、いいね数順）を分析

**レスポンス例:**
```json
{
  "summary": {
    "id": "summary-uuid",
    "lecture_id": "lecture-uuid",
    "summary_text": "要約テキスト...",
    "total_posts_count": 100,
    "total_likes_count": 250,
    "created_at": "2025-12-11T10:00:00.000Z"
  },
  "message": "要約が正常に生成されました"
}
```

### 2. Vercel Cronジョブ（自動要約処理）

**エンドポイント:** `GET /api/cron/summarize-lectures`

**実行頻度:** 1時間ごと（`0 * * * *`）

**機能:**
- `status = 'ended'`の講義を取得
- 講義終了から1時間経過後、自動的に要約処理を実行
- 既に要約済みの講義はスキップ
- 各講義に対して要約生成APIを呼び出し

**設定:**
- `vercel.json`にCronジョブを定義

**セキュリティ:**
- 本番環境では`CRON_SECRET`環境変数で認証（オプション）

### 3. 要約表示画面

**パス:** `/lecture/[id]/summary`

**機能:**
- 講義の要約を表示
- 統計情報（投稿総数、いいね総数）を表示
- 講義情報（コースコード、タイトル、回数）を表示

**実装ファイル:**
- `app/lecture/[id]/summary/page.tsx` - 要約表示画面
- `app/api/lectures/[id]/summary/route.ts` - 要約取得API

## 使用方法

### 手動で要約を生成

```bash
curl -X POST http://localhost:3000/api/lectures/{lecture_id}/summarize
```

### 自動要約（Vercel Cron）

1. `vercel.json`をコミット・プッシュ
2. Vercelが自動的にCronジョブを登録
3. 1時間ごとに自動実行される

### 要約を表示

ブラウザで `/lecture/{lecture_id}/summary` にアクセス

## データフロー

1. **講義終了** → `status = 'ended'`
2. **1時間経過** → Vercel Cronが自動実行
3. **要約生成** → OpenAI APIで要約生成
4. **保存** → `summaries`テーブルに保存
5. **ステータス更新** → `status = 'summarized'`
6. **生データ削除** → 管理者が手動で削除（`/api/lectures/[id]/delete-data`）

## 注意事項

### OpenAI API

- **コスト:** `gpt-4o-mini`は比較的安価ですが、使用量に応じてコストが発生します
- **トークン制限:** 大量の投稿がある場合、上位50件に制限しています
- **エラーハンドリング:** API呼び出し失敗時は適切にエラーを返します

### タイミング

- **遅延時間:** 講義終了から1時間後に要約を生成（設定可能）
- **実行頻度:** 1時間ごとにチェック（Vercel Cron）

### セキュリティ

- **認証:** 要約生成APIは認証不要（内部APIとして使用）
- **Cron認証:** 本番環境では`CRON_SECRET`を設定することを推奨

## トラブルシューティング

### 要約が生成されない

1. OpenAI APIキーが設定されているか確認
2. 講義のステータスが`'ended'`か確認
3. 投稿が存在するか確認
4. 既に要約が存在しないか確認

### Cronジョブが実行されない

1. `vercel.json`が正しくデプロイされているか確認
2. Vercelダッシュボードの「Cron Jobs」で登録されているか確認
3. 実行ログを確認

### エラーメッセージ

- `OpenAI APIキーが設定されていません` → `.env.local`に`OPENAI_API_KEY`を設定
- `講義が終了していません` → 講義のステータスを`'ended'`に更新
- `要約する投稿がありません` → 投稿データが存在するか確認

## 関連ファイル

- `app/api/lectures/[id]/summarize/route.ts` - 要約生成API
- `app/api/cron/summarize-lectures/route.ts` - 自動要約Cronジョブ
- `app/api/lectures/[id]/summary/route.ts` - 要約取得API
- `app/lecture/[id]/summary/page.tsx` - 要約表示画面
- `vercel.json` - Vercel Cron設定
- `schema.sql` - `summaries`テーブル定義

