# 自動終了トリガー機能

## 概要

講義の終了時刻を自動的にチェックし、終了時刻を過ぎた講義を自動的に`status = 'ended'`に更新する機能です。

## 実装内容

### 1. APIエンドポイント

**エンドポイント:** `GET /api/cron/check-lecture-end`

**機能:**
- `status = 'active'`の講義を取得
- `scheduled_end_time`をチェック
- 終了時刻を過ぎていたら`status = 'ended'`に更新

**レスポンス例:**
```json
{
  "message": "講義の自動終了処理が完了しました",
  "checked_at": "2025-12-11T10:00:00.000Z",
  "active_lectures_count": 5,
  "processed_count": 2,
  "ended_lectures": [
    {
      "id": "lecture-uuid-1",
      "scheduled_end_time": "2025-12-11T09:30:00.000Z"
    }
  ]
}
```

### 2. Vercel Cron設定

`vercel.json`にCronジョブを定義：

```json
{
  "crons": [
    {
      "path": "/api/cron/check-lecture-end",
      "schedule": "0 0 * * *"
    }
  ]
}
```

**実行頻度:** 1日1回（`0 0 * * *`）- 毎日午前0時（UTC）

**⚠️ 注意:** Vercel Hobbyプランは1日1回のCron実行に制限されています。より頻繁なチェックが必要な場合は、管理画面から手動で講義を終了するか、Vercel Proプランへのアップグレードを検討してください。

### 3. セキュリティ

本番環境では、環境変数`CRON_SECRET`を設定してCronジョブを保護できます：

1. `.env.local`に`CRON_SECRET`を追加
2. Vercelの環境変数にも`CRON_SECRET`を設定
3. APIルートが`Authorization: Bearer ${CRON_SECRET}`ヘッダーをチェック

**注意:** 開発環境では認証チェックがスキップされます。

## 使用方法

### ローカル開発環境

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. 手動でAPIを呼び出してテスト：
   ```bash
   curl http://localhost:3000/api/cron/check-lecture-end
   ```

### 本番環境（Vercel）

1. `vercel.json`をコミット・プッシュ
2. Vercelが自動的にCronジョブを登録
3. 1日1回（毎日午前0時UTC）に自動実行される

**確認方法:**
- Vercelダッシュボードの「Cron Jobs」セクションで実行履歴を確認
- APIログで実行結果を確認

### 手動実行（推奨）

自動チェックは1日1回のみのため、講義終了後すぐに処理したい場合は、管理画面から手動で講義を終了してください：

1. 管理画面にログイン（`/admin`）
2. 「講義終了管理」ページに移動（`/admin/lectures/end`）
3. 終了したい講義の「講義を終了」ボタンをクリック

これにより、即座に講義を終了できます。

## 動作確認

### テストデータの準備

1. 講義セッションを作成（`status = 'active'`）
2. `scheduled_end_time`を過去の時刻に設定
3. Cronジョブが実行されるのを待つ（最大24時間、または手動実行）
4. 講義の`status`が`'ended'`に更新されているか確認

**注意:** 自動チェックは1日1回のみのため、テスト時は手動でAPIを呼び出すことを推奨します。

### 手動テスト

```bash
# ローカル環境
curl http://localhost:3000/api/cron/check-lecture-end

# 本番環境（認証が必要な場合）
curl -H "Authorization: Bearer your_cron_secret" \
  https://your-domain.vercel.app/api/cron/check-lecture-end
```

## トラブルシューティング

### Cronジョブが実行されない

1. `vercel.json`が正しくデプロイされているか確認
2. Vercelダッシュボードの「Cron Jobs」で登録されているか確認
3. 実行ログを確認

### 講義が終了されない

1. `scheduled_end_time`が設定されているか確認
2. 現在時刻が`scheduled_end_time`を過ぎているか確認
3. 講義の`status`が`'active'`か確認

### 認証エラー

1. `.env.local`に`CRON_SECRET`が設定されているか確認
2. Vercelの環境変数にも`CRON_SECRET`が設定されているか確認
3. `Authorization`ヘッダーが正しく送信されているか確認

## 注意事項

- **実行頻度:** Vercel Hobbyプランは1日1回のCron実行に制限されています
- **推奨:** 講義終了後すぐに処理したい場合は、管理画面から手動で講義を終了してください
- **タイムゾーン:** サーバー時間（UTC）で判定されます。`scheduled_end_time`もUTCで保存されていることを確認してください
- **エラーハンドリング:** エラーが発生しても、次の実行で再試行されます
- **Vercel Proプラン:** より頻繁な実行が必要な場合は、Vercel Proプランへのアップグレードを検討してください

## 関連ファイル

- `app/api/cron/check-lecture-end/route.ts` - APIルート
- `vercel.json` - Vercel Cron設定
- `app/api/lectures/[id]/end/route.ts` - 手動終了API（参考）

