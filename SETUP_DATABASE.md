# データベーススキーマ適用ガイド

Supabaseにデータベーススキーマを適用する手順を説明します。

## 1. Supabaseダッシュボードにアクセス

1. [Supabase](https://supabase.com/)にログイン
2. 作成したプロジェクトを選択

## 2. SQL Editorを開く

1. 左サイドバーの「SQL Editor」をクリック
   - または、上部メニューの「SQL Editor」を選択

## 3. スキーマを実行

1. **新しいクエリを作成**
   - 「New query」ボタンをクリック
   - または、既存のクエリエリアを使用

2. **schema.sqlの内容をコピー**
   - プロジェクトの`schema.sql`ファイルを開く
   - すべての内容をコピー（Ctrl+A → Ctrl+C）

3. **SQL Editorに貼り付け**
   - SupabaseのSQL Editorに貼り付け（Ctrl+V）

4. **実行**
   - 「Run」ボタンをクリック（または Ctrl+Enter）
   - 実行が完了するまで数秒待機

## 4. 実行結果の確認

### 成功した場合

以下のようなメッセージが表示されます：
```
Success. No rows returned
```

または、各コマンドの実行結果が表示されます：
- `CREATE TYPE` - ENUM型の作成
- `CREATE TABLE` - テーブルの作成
- `CREATE INDEX` - インデックスの作成
- `CREATE TRIGGER` - トリガーの作成

### エラーが発生した場合

エラーメッセージが表示されます。よくあるエラー：

#### エラー: "relation already exists"
- **原因**: テーブルや型が既に存在している
- **解決方法**: 
  - 既存のテーブルを削除してから再実行
  - または、`DROP TABLE IF EXISTS`文を追加

#### エラー: "permission denied"
- **原因**: 権限が不足している
- **解決方法**: プロジェクトのオーナー権限があることを確認

## 5. テーブルの確認

スキーマが正しく適用されたか確認：

1. 左サイドバーの「Table Editor」をクリック
2. 以下のテーブルが表示されることを確認：
   - ✅ `courses`
   - ✅ `lectures`
   - ✅ `posts`
   - ✅ `likes`
   - ✅ `summaries`

## 6. 接続テスト

環境変数とデータベーススキーマが正しく設定されているか確認：

```bash
npm run test:connection
```

このコマンドは以下を確認します：
- ✅ 環境変数が正しく設定されているか
- ✅ Supabaseへの接続が成功するか
- ✅ すべてのテーブルが存在するか

### 接続テストが成功した場合

```
✅ Supabaseへの接続成功！
✅ データベーススキーマが正しく適用されています

📊 テーブルの確認...

✅ courses: OK
✅ lectures: OK
✅ posts: OK
✅ likes: OK
✅ summaries: OK

🎉 すべての設定が完了しています！
次のステップ: npm run dev で開発サーバーを起動してください
```

### 接続テストが失敗した場合

エラーメッセージに従って対処してください：

- **環境変数が未設定**: `.env.local`ファイルを確認
- **スキーマが未適用**: 上記の手順でスキーマを適用
- **接続エラー**: SupabaseプロジェクトのURLとキーを確認

## 7. トラブルシューティング

### スキーマを再適用したい場合

既存のテーブルを削除してから再実行：

```sql
-- 注意: この操作はすべてのデータを削除します
DROP TABLE IF EXISTS summaries CASCADE;
DROP TABLE IF EXISTS likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS lectures CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TYPE IF EXISTS lecture_status CASCADE;
```

その後、`schema.sql`を再実行してください。

### 特定のテーブルだけ再作成したい場合

1. Table Editorで該当テーブルを削除
2. SQL Editorで該当テーブルのCREATE文のみを実行

## 8. 次のステップ

スキーマの適用が完了したら：

1. **接続テストを実行**
   ```bash
   npm run test:connection
   ```

2. **開発サーバーを起動**
   ```bash
   npm run dev
   ```

3. **動作確認**
   - ブラウザで `http://localhost:3000` にアクセス
   - エラーがないか確認

---

## 参考

- [Supabase SQL Editor Documentation](https://supabase.com/docs/guides/database/tables)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

