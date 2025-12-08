# 生データ物理削除API

## 概要

講義終了後、投稿データ（`posts`）といいねデータ（`likes`）を物理削除するAPIです。
この操作は**不可逆的**で、削除されたデータは復元できません。

## エンドポイント

### POST `/api/lectures/[id]/delete-data`

講義の生データを物理削除します。

#### リクエスト

```bash
POST /api/lectures/{lecture_id}/delete-data
```

#### レスポンス

**成功時 (200 OK):**
```json
{
  "message": "生データの物理削除が完了しました",
  "lecture_id": "a8532ca6-cdda-4ba7-8522-0966f60e65b1",
  "deleted_posts_count": 10,
  "deleted_likes_count": 45,
  "status": "summarized"
}
```

**エラー時:**
- `400 Bad Request`: 講義が終了していない、または既に削除済み
- `404 Not Found`: 講義が見つからない
- `500 Internal Server Error`: サーバーエラー

---

### GET `/api/lectures/[id]/delete-data`

削除前の統計情報を取得します。

#### リクエスト

```bash
GET /api/lectures/{lecture_id}/delete-data
```

#### レスポンス

```json
{
  "lecture_id": "a8532ca6-cdda-4ba7-8522-0966f60e65b1",
  "status": "ended",
  "posts_count": 10,
  "likes_count": 45,
  "can_delete": true,
  "already_deleted": false
}
```

---

## 使用例

### cURL

```bash
# 統計情報を取得
curl -X GET http://localhost:3000/api/lectures/{lecture_id}/delete-data

# 生データを削除
curl -X POST http://localhost:3000/api/lectures/{lecture_id}/delete-data
```

### JavaScript (fetch)

```javascript
// 統計情報を取得
const stats = await fetch(`/api/lectures/${lectureId}/delete-data`)
  .then(res => res.json())

console.log(`投稿数: ${stats.posts_count}, いいね数: ${stats.likes_count}`)

// 生データを削除
const result = await fetch(`/api/lectures/${lectureId}/delete-data`, {
  method: 'POST'
})
  .then(res => res.json())

console.log(`削除完了: ${result.deleted_posts_count}件の投稿、${result.deleted_likes_count}件のいいね`)
```

---

## 処理フロー

1. **講義の状態確認**
   - `status = 'ended'`であることを確認
   - 既に`'summarized'`の場合は削除済みとして返す

2. **統計情報の取得**
   - 削除前の投稿数といいね数を取得（ログ用）

3. **いいねデータの削除**
   - 外部キー制約により、先に`likes`テーブルから削除

4. **投稿データの削除**
   - `posts`テーブルから該当講義の投稿を削除

5. **講義ステータスの更新**
   - `lectures.status`を`'summarized'`に更新

---

## 注意事項

### ⚠️ 重要な警告

- **この操作は不可逆的です**。削除されたデータは復元できません。
- 削除前に必ず統計情報を確認してください。
- 本番環境では、削除前にバックアップを取得することを推奨します。

### 前提条件

- 講義のステータスが`'ended'`であること
- 既に`'summarized'`の場合は削除済みとして処理されます

### エラーハンドリング

- 各ステップでエラーが発生した場合、詳細なエラーメッセージを返します
- サーバーログに詳細なエラー情報が記録されます

---

## テスト方法

### 1. テストデータの準備

```sql
-- 講義を終了状態にする
UPDATE lectures 
SET status = 'ended' 
WHERE id = 'your-lecture-id';
```

### 2. 統計情報の確認

```bash
curl -X GET http://localhost:3000/api/lectures/your-lecture-id/delete-data
```

### 3. 削除の実行

```bash
curl -X POST http://localhost:3000/api/lectures/your-lecture-id/delete-data
```

### 4. 削除の確認

```sql
-- 投稿データが削除されているか確認
SELECT COUNT(*) FROM posts WHERE lecture_id = 'your-lecture-id';
-- 結果: 0

-- いいねデータが削除されているか確認
SELECT COUNT(*) FROM likes 
WHERE post_id IN (SELECT id FROM posts WHERE lecture_id = 'your-lecture-id');
-- 結果: 0

-- 講義ステータスが更新されているか確認
SELECT status FROM lectures WHERE id = 'your-lecture-id';
-- 結果: summarized
```

---

## 関連ファイル

- `app/api/lectures/[id]/delete-data/route.ts` - API実装
- `lib/supabase/server.ts` - Service Role Keyを使用したSupabaseクライアント
- `schema.sql` - データベーススキーマ

---

## 次のステップ

このAPIは、Phase 3のAI要約機能と組み合わせて使用します：

1. AI要約を生成
2. 要約を`summaries`テーブルに保存
3. このAPIで生データを物理削除

詳細は`TODO.md`を参照してください。

