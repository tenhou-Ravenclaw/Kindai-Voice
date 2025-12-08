# タイムゾーン対応の移行ガイド

## 概要

データベースのタイムスタンプ型を`TIMESTAMP`から`TIMESTAMPTZ`（タイムゾーン付きタイムスタンプ）に変更し、タイムゾーン情報を明示的に処理するように改善しました。

## 変更内容

### 1. データベーススキーマの変更

すべての`TIMESTAMP`型を`TIMESTAMPTZ`型に変更しました：

- `courses.created_at`, `courses.updated_at`
- `lectures.scheduled_start_time`, `lectures.scheduled_end_time`, `lectures.created_at`, `lectures.updated_at`
- `posts.created_at`, `posts.deleted_at`
- `likes.created_at`
- `summaries.created_at`

### 2. フロントエンドの改善

以下のファイルでタイムゾーンを明示的に処理するように改善しました：

- `app/lecture/[id]/page.tsx` - 投稿のタイムスタンプ表示
- `app/page.tsx` - アクティブ講義の時間表示
- `app/lecture/[id]/summary/page.tsx` - 要約の生成日時表示
- `app/admin/lectures/page.tsx` - 管理画面の講義時間表示

すべての日時表示で`timeZone: 'Asia/Tokyo'`を明示的に指定しています。

## 移行手順

### 既存データベースがある場合

既存のデータベースを移行する場合は、以下の手順を実行してください：

1. **データベースのバックアップを取得**
   ```sql
   -- Supabaseダッシュボードからバックアップを取得するか、
   -- pg_dumpを使用してバックアップを取得してください
   ```

2. **移行スクリプトを実行**
   ```sql
   -- scripts/migrate-timestamp-to-timestamptz.sql を実行
   -- SupabaseダッシュボードのSQL Editorで実行してください
   ```

3. **移行結果を確認**
   ```sql
   SELECT 
     table_name,
     column_name,
     data_type
   FROM information_schema.columns
   WHERE table_schema = 'public'
     AND column_name IN ('created_at', 'updated_at', 'scheduled_start_time', 'scheduled_end_time', 'deleted_at')
   ORDER BY table_name, column_name;
   ```
   すべての`data_type`が`timestamp with time zone`になっていることを確認してください。

### 新規データベースの場合

新規にデータベースを作成する場合は、`schema.sql`をそのまま実行してください。すでに`TIMESTAMPTZ`型で定義されています。

## 動作確認

移行後、以下の点を確認してください：

1. **投稿のタイムスタンプ表示**
   - 講義ページで投稿のタイムスタンプが正しく表示されるか
   - 「○分前」「○時間前」などの相対時間が正しく表示されるか

2. **講義時間の表示**
   - ホーム画面のアクティブ講義一覧で時間が正しく表示されるか
   - 管理画面の講義一覧で時間が正しく表示されるか

3. **要約の生成日時**
   - 要約ページで生成日時が正しく表示されるか

## 注意事項

- 移行スクリプトは既存のデータを保持しながら型を変更します
- 移行中はデータベースへの書き込みを停止することを推奨します
- 移行前に必ずバックアップを取得してください
- 移行後、アプリケーションの動作を十分にテストしてください

## トラブルシューティング

### タイムスタンプが9時間ずれている

これは、データベースのタイムゾーン設定がUTCになっている場合に発生する可能性があります。移行スクリプトでは、既存の`TIMESTAMP`データをUTCとして解釈して`TIMESTAMPTZ`に変換しています。

もし問題が発生した場合は、以下のクエリでデータベースのタイムゾーン設定を確認してください：

```sql
SHOW timezone;
```

日本時間（JST）に設定する場合は：

```sql
SET timezone = 'Asia/Tokyo';
```

ただし、Supabaseでは通常、データベースのタイムゾーンはUTCに設定されており、アプリケーション側で`timeZone: 'Asia/Tokyo'`を指定することで正しく表示されます。

