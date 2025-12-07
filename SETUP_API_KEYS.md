# APIキー取得ガイド

このプロジェクトで必要なAPIキーの取得方法を説明します。

## 1. Supabase認証情報

### 1.1 Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com/)にアクセス
2. 「Start your project」をクリック
3. GitHubアカウントでログイン（推奨）またはメールアドレスで登録
4. 「New Project」をクリック
5. 以下の情報を入力：
   - **Organization**: 既存の組織を選択、または新規作成
   - **Name**: プロジェクト名（例：`kindai-voice`）
   - **Database Password**: データベースのパスワード（必ず記録しておく）
   - **Region**: 最寄りのリージョンを選択（例：`Northeast Asia (Tokyo)`）
6. 「Create new project」をクリック
7. プロジェクトの作成完了まで数分待機

### 1.2 Supabase認証情報の取得

1. Supabaseダッシュボードにログイン
2. 作成したプロジェクトを選択
3. 左サイドバーの「Settings」（⚙️アイコン）をクリック
4. 「API」セクションを選択

#### 取得する情報

**① Project URL**
- 「Project URL」の値をコピー
- 例：`https://xxxxxxxxxxxxx.supabase.co`
- `.env.local`の`NEXT_PUBLIC_SUPABASE_URL`に設定

**② anon public key**
- 「Project API keys」セクションの「anon public」キーをコピー
- 「Reveal」ボタンをクリックして表示
- `.env.local`の`NEXT_PUBLIC_SUPABASE_ANON_KEY`に設定

**③ service_role key（重要：機密情報）**
- 「Project API keys」セクションの「service_role」キーをコピー
- 「Reveal」ボタンをクリックして表示
- ⚠️ **警告**: このキーは管理者権限を持ちます。絶対にクライアントサイド（ブラウザ）で使用しないでください
- `.env.local`の`SUPABASE_SERVICE_ROLE_KEY`に設定
- このキーはPhase 3のAI要約・データ削除処理など、サーバーサイドのみで使用します

### 1.3 スクリーンショットの参考位置

```
Supabase Dashboard
├── Settings (⚙️)
│   └── API
│       ├── Project URL: [ここをコピー]
│       └── Project API keys
│           ├── anon public: [Reveal] → [ここをコピー]
│           └── service_role: [Reveal] → [ここをコピー]
```

---

## 2. OpenAI APIキー

### 2.1 OpenAIアカウントの作成

1. [OpenAI Platform](https://platform.openai.com/)にアクセス
2. 「Sign up」をクリックしてアカウントを作成
   - メールアドレスまたはGoogle/Microsoftアカウントで登録
3. メール認証を完了

### 2.2 支払い情報の登録（必須）

⚠️ **重要**: OpenAI APIを使用するには、支払い情報の登録が必要です。

1. ダッシュボードの「Billing」→「Payment methods」を開く
2. クレジットカード情報を入力
3. 使用量に応じて課金されます（`gpt-4o-mini`は比較的安価）

### 2.3 APIキーの作成

1. [API Keys](https://platform.openai.com/api-keys)ページにアクセス
2. 「Create new secret key」をクリック
3. キー名を入力（例：`kindai-voice-dev`）
4. 「Create secret key」をクリック
5. ⚠️ **重要**: 表示されたキーをすぐにコピーしてください。この画面を閉じると二度と表示されません
6. `.env.local`の`OPENAI_API_KEY`に設定

### 2.4 使用量の確認

- ダッシュボードの「Usage」でAPI使用量とコストを確認できます
- `gpt-4o-mini`は1,000トークンあたり約$0.15（入力）/$0.60（出力）です

---

## 3. 環境変数ファイルの設定

### 3.1 ファイルの作成

プロジェクトルートで以下のコマンドを実行：

```bash
cp env.example .env.local
```

### 3.2 値を設定

`.env.local`ファイルを開き、取得した値を設定：

```env
# Supabase設定
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# OpenAI API設定
OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.3 設定の確認

環境変数が正しく設定されているか確認：

```bash
# Windows (PowerShell)
Get-Content .env.local

# または、開発サーバーを起動してエラーがないか確認
npm run dev
```

---

## 4. セキュリティの注意事項

### 4.1 絶対に公開しない情報

- ✅ `.env.local`ファイルは`.gitignore`に含まれています（Gitにコミットされません）
- ❌ APIキーをGitHub、Slack、メールなどで共有しない
- ❌ コードに直接APIキーを書かない
- ❌ クライアントサイド（ブラウザ）で`SUPABASE_SERVICE_ROLE_KEY`を使用しない

### 4.2 本番環境での設定

Vercelにデプロイする場合：

1. Vercelダッシュボードのプロジェクト設定を開く
2. 「Settings」→「Environment Variables」を選択
3. 各環境変数を追加：
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `OPENAI_API_KEY`

### 4.3 キーのローテーション

セキュリティ上の理由で定期的にキーを変更することを推奨：

- **Supabase**: Settings → API → 「Reset」ボタンで再生成
- **OpenAI**: API Keysページで古いキーを削除し、新しいキーを作成

---

## 5. トラブルシューティング

### 5.1 Supabase接続エラー

- `NEXT_PUBLIC_SUPABASE_URL`が正しいか確認（末尾に`/`がないか確認）
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`が正しくコピーされているか確認
- Supabaseプロジェクトがアクティブか確認

### 5.2 OpenAI APIエラー

- APIキーが正しく設定されているか確認
- 支払い情報が登録されているか確認
- 使用量制限に達していないか確認（Usageページで確認）

### 5.3 環境変数が読み込まれない

- `.env.local`ファイルがプロジェクトルートにあるか確認
- 開発サーバーを再起動（`npm run dev`）
- ファイル名が`.env.local`であることを確認（`.env`ではない）

---

## 6. 次のステップ

APIキーの設定が完了したら：

1. **データベーススキーマの適用**
   - Supabaseダッシュボードの「SQL Editor」を開く
   - `schema.sql`の内容をコピー＆ペーストして実行

2. **開発サーバーの起動**
   ```bash
   npm run dev
   ```

3. **動作確認**
   - ブラウザで `http://localhost:3000` にアクセス
   - エラーがないか確認

---

## 参考リンク

- [Supabase Documentation](https://supabase.com/docs)
- [OpenAI API Documentation](https://platform.openai.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)

