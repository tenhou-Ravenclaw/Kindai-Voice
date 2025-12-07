# Supabase Realtime設定ガイド

リアルタイム同期機能を使用するために、SupabaseでRealtimeを有効にする必要があります。

## 1. SupabaseダッシュボードでRealtimeを有効化

### 手順

1. **Supabaseダッシュボードにアクセス**
   - [Supabase](https://supabase.com/)にログイン
   - プロジェクトを選択

2. **Database → Replication を開く**
   - 左サイドバーの「Database」をクリック
   - 「Replication」を選択

3. **postsテーブルのRealtimeを有効化**
   - `posts`テーブルを見つける
   - トグルスイッチをONにする

4. **likesテーブルのRealtimeを有効化（いいね機能用）**
   - `likes`テーブルを見つける
   - トグルスイッチをONにする

### または、SQLで有効化

Supabase SQL Editorで以下を実行：

```sql
-- postsテーブルのRealtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- likesテーブルのRealtimeを有効化
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
```

## 2. 動作確認

Realtimeを有効化した後：

1. ブラウザで `http://localhost:3000` にアクセス
2. 講義コード `DB001` を入力して入室
3. 別のブラウザタブ（または別のブラウザ）で同じ講義ページを開く
4. 片方のタブで投稿を作成
5. もう片方のタブで自動的に投稿が表示されることを確認

## 3. トラブルシューティング

### リアルタイム同期が動作しない場合

1. **Realtimeが有効になっているか確認**
   - Database → Replication で確認

2. **ブラウザのコンソールでエラーを確認**
   - F12キーで開発者ツールを開く
   - Consoleタブでエラーを確認

3. **Supabaseの接続を確認**
   - 環境変数が正しく設定されているか確認
   - `.env.local`ファイルを確認

4. **ネットワーク接続を確認**
   - WebSocket接続がブロックされていないか確認
   - ファイアウォールやプロキシの設定を確認

---

## 参考

- [Supabase Realtime Documentation](https://supabase.com/docs/guides/realtime)
- [PostgreSQL Logical Replication](https://www.postgresql.org/docs/current/logical-replication.html)

