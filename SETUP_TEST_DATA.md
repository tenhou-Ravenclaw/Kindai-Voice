# テストデータ作成ガイド

Kindai Voiceの開発・テスト用データを作成する手順を説明します。

## 1. テストデータの作成

### 手順

1. **Supabaseダッシュボードにアクセス**
   - [Supabase](https://supabase.com/)にログイン
   - プロジェクトを選択

2. **SQL Editorを開く**
   - 左サイドバーの「SQL Editor」をクリック
   - 「New query」をクリック

3. **テストデータ作成スクリプトを実行**
   - `scripts/seed-test-data.sql`の内容をコピー
   - SQL Editorに貼り付け
   - 「Run」ボタンをクリック

### 作成されるテストデータ

#### コース（3つ）
- **DB001**: データベース基礎（月曜日 10:00-11:30）
- **WEB001**: Web開発入門（火曜日 14:00-15:30）
- **ALG001**: アルゴリズムとデータ構造（水曜日 10:00-11:30）

#### 講義セッション
- **DB001 第1回**: 開催中（`status = 'active'`）
- **DB001 第2回**: 開催前（`status = 'scheduled'`）
- **WEB001 第1回**: 開催中（`status = 'active'`）
- **ALG001 第1回**: 開催前（`status = 'scheduled'`）

#### 投稿データ
- **DB001 第1回**: 10件の投稿（いいね数付き）

## 2. 動作確認

### 講義コード入力画面でテスト

1. ブラウザで `http://localhost:3000` にアクセス
2. 以下の講義コードを入力して「入室する」をクリック：
   - `DB001` → DB001の第1回目（開催中）に遷移
   - `WEB001` → WEB001の第1回目（開催中）に遷移
   - `ALG001` → エラー（開催中の講義がない）

### 期待される動作

- ✅ `DB001`と`WEB001`は正常に投稿画面に遷移
- ✅ `ALG001`は「開催中の講義が見つかりませんでした」と表示
- ✅ 存在しない講義コードは「講義が見つかりませんでした」と表示

## 3. テストデータの削除

テストデータを削除したい場合：

1. **SQL Editorを開く**
2. **`scripts/clear-test-data.sql`の内容をコピー**
3. **実行**

⚠️ **注意**: このスクリプトは以下のデータを削除します：
- DB001, WEB001, ALG001のコース
- 関連するすべての講義セッション
- 関連するすべての投稿
- 関連するすべてのいいね

## 4. カスタムテストデータの作成

独自のテストデータを作成したい場合：

### コースの作成

```sql
INSERT INTO courses (code, title, total_sessions, regular_day_of_week, regular_start_time, regular_end_time, first_session_date)
VALUES (
  'YOUR01',  -- 講義コード
  'あなたの講義名',
  15,
  1,  -- 0=日曜, 1=月曜, ..., 6=土曜
  '10:00:00',
  '11:30:00',
  CURRENT_DATE  -- 第1回目の日付
);
```

### 開催中の講義セッションの作成

```sql
INSERT INTO lectures (course_id, session_number, status, scheduled_start_time, scheduled_end_time)
SELECT 
  c.id,
  1,  -- 回数
  'active'::lecture_status,  -- 開催中
  NOW() - INTERVAL '30 minutes',  -- 開始時刻（30分前）
  NOW() + INTERVAL '60 minutes'   -- 終了時刻（60分後）
FROM courses c
WHERE c.code = 'YOUR01';
```

### 投稿の作成

```sql
INSERT INTO posts (lecture_id, content, like_count)
SELECT 
  l.id,
  'テスト投稿です',
  0
FROM lectures l
JOIN courses c ON l.course_id = c.id
WHERE c.code = 'YOUR01' AND l.session_number = 1;
```

## 5. データの確認

### コース一覧の確認

```sql
SELECT code, title, total_sessions, regular_day_of_week 
FROM courses 
ORDER BY code;
```

### 開催中の講義の確認

```sql
SELECT 
  c.code AS course_code,
  c.title AS course_title,
  l.session_number,
  l.status,
  l.scheduled_start_time,
  l.scheduled_end_time
FROM lectures l
JOIN courses c ON l.course_id = c.id
WHERE l.status = 'active'
ORDER BY c.code, l.session_number;
```

### 投稿の確認

```sql
SELECT 
  c.code AS course_code,
  l.session_number,
  p.content,
  p.like_count,
  p.created_at
FROM posts p
JOIN lectures l ON p.lecture_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE p.deleted_at IS NULL
ORDER BY p.created_at DESC;
```

## 6. トラブルシューティング

### エラー: "relation does not exist"

- データベーススキーマが適用されていない可能性があります
- `schema.sql`を実行してから、再度テストデータを作成してください

### エラー: "duplicate key value"

- テストデータが既に存在している可能性があります
- `scripts/clear-test-data.sql`を実行してから、再度作成してください

### 講義コードを入力してもエラーになる

- 講義セッションの`status`が`'active'`になっているか確認
- SQL Editorで以下を実行：
  ```sql
  SELECT 
    c.code,
    l.session_number,
    l.status
  FROM lectures l
  JOIN courses c ON l.course_id = c.id
  WHERE c.code = 'DB001';
  ```

---

## 参考

- [Supabase SQL Editor Documentation](https://supabase.com/docs/guides/database/tables)
- [PostgreSQL Date/Time Functions](https://www.postgresql.org/docs/current/functions-datetime.html)

