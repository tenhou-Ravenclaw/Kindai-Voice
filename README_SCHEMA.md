# データベーススキーマ説明

## テーブル一覧

### 1. `courses` - 講義コース情報
15回分の講義に共通する情報を管理します。

**主要カラム:**
- `code`: 講義コード（学生が入力、15回共通）
- `regular_day_of_week`: 定期開催曜日（0=日曜、1=月曜、...、6=土曜）
- `regular_start_time` / `regular_end_time`: 定期開催の時刻
- `first_session_date`: 第1回目の開催日

### 2. `lectures` - 各回の講義セッション情報
1つのコースに対して最大15個のセッションが存在します。

**主要カラム:**
- `course_id`: 講義コースへの参照
- `session_number`: 回数（1-15）
- `status`: ステータス（scheduled/active/ended/summarized）
- `scheduled_start_time` / `scheduled_end_time`: 予定日時
- `is_rescheduled`: 日程変更フラグ

### 3. `posts` - 投稿データ
講義中の投稿を管理します。Phase 3で物理削除されます。

**主要カラム:**
- `lecture_id`: 講義セッションへの参照
- `content`: 投稿内容（最大200字）
- `like_count`: いいね数（リアルタイム更新）
- `deleted_at`: 削除日時（監査用）

### 4. `likes` - いいねデータ
投稿へのいいねを管理します。1人1回制限あり。Phase 3で物理削除されます。

**主要カラム:**
- `post_id`: 投稿への参照
- `user_identifier`: ユーザー識別子（LocalStorageのUUID）
- UNIQUE制約: `(post_id, user_identifier)` で1人1回制限

### 5. `summaries` - AI要約データ
講義終了後のAI要約を永続保存します。

**主要カラム:**
- `lecture_id`: 講義セッションへの参照（UNIQUE）
- `summary_text`: AI生成の要約テキスト
- `total_posts_count` / `total_likes_count`: 統計情報

## データライフサイクル

### Phase 1: リアルタイム期間（講義中）
- `lectures.status = 'active'`
- `posts`と`likes`にデータが追加される
- Supabase Realtimeでリアルタイム同期

### Phase 2: 講義終了トリガー
- `lectures.status = 'ended'`

### Phase 3: AI要約とデータ破棄
- `summaries`に要約を保存
- `posts`と`likes`を物理削除（DELETE文）
- `lectures.status = 'summarized'`

## Supabaseでの実行方法

1. Supabaseダッシュボードにログイン
2. SQL Editorを開く
3. `schema.sql`の内容をコピー＆ペースト
4. 実行ボタンをクリック

## 注意事項

- このスキーマは認証なしの匿名投稿を前提としています
- RLS（Row Level Security）は無効化されています
- セキュリティ対策はアプリケーション層で実装してください
