# 管理画面セットアップガイド

## 概要

認証付きの管理画面で、コースと講義セッションの作成・編集・削除ができます。

## セットアップ手順

### 1. Supabase Authの有効化

1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 左サイドバーの「Authentication」をクリック
4. 「Providers」セクションで「Email」を有効化
5. 「Settings」セクションで以下を設定：
   - **Site URL**: `http://localhost:3000` (開発環境)
   - **Redirect URLs**: `http://localhost:3000/admin/**`

### 2. 管理者アカウントの作成

#### 方法1: Supabaseダッシュボードから作成（推奨）

1. Supabaseダッシュボードの「Authentication」→「Users」を開く
2. 「Add user」ボタンをクリック
3. 以下の情報を入力：
   - **Email**: 任意のメールアドレス（例：`admin@example.com`）
   - **Password**: 任意のパスワード（8文字以上推奨）
   - **Auto Confirm User**: ✅ **チェックを入れる**（重要：メール確認をスキップ）
4. 「Create user」をクリック

⚠️ **重要**: 「Auto Confirm User」にチェックを入れないと、メール確認が必要になりログインできません。

#### 方法2: Supabase CLIを使用（開発環境のみ）

```bash
supabase auth users create admin@example.com --password your_password
```

#### トラブルシューティング

**「Invalid login credentials」エラーが表示される場合：**

1. メールアドレスとパスワードが正しいか確認
2. Supabaseダッシュボードの「Authentication」→「Users」でユーザーが存在するか確認
3. ユーザーの「Email Confirmed」状態を確認（「Auto Confirm User」にチェックを入れていれば確認済み）
4. Supabase Authの設定で「Email」プロバイダーが有効になっているか確認

### 3. 管理画面へのアクセス

1. 開発サーバーを起動：
   ```bash
   npm run dev
   ```

2. ブラウザで `http://localhost:3000/admin` にアクセス
3. ログイン画面が表示されるので、作成した管理者アカウントでログイン

## 機能

### コース管理 (`/admin/courses`)

- **作成**: 講義コースの新規作成
- **編集**: 既存コースの編集
- **削除**: コースの削除（関連する講義セッションも削除されます）

### 講義セッション管理 (`/admin/lectures`)

- **作成**: 講義セッションの新規作成
- **編集**: 既存セッションの編集
- **削除**: セッションの削除

### 講義終了管理 (`/admin/lectures/end`)

- 講義の終了処理
- 生データの物理削除

## セキュリティ

- すべての管理画面APIは認証が必要です
- 認証トークンは各リクエストの`Authorization`ヘッダーで送信されます
- 未認証のユーザーは自動的にログイン画面にリダイレクトされます

## トラブルシューティング

### ログインできない場合

1. Supabase Authが有効になっているか確認
2. メールアドレスとパスワードが正しいか確認
3. ブラウザのコンソールでエラーを確認

### 認証エラーが発生する場合

1. `.env.local`に`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`が設定されているか確認
2. Supabaseダッシュボードで認証設定を確認

## 今後の拡張

- 講義セッション管理画面の実装
- 講義終了管理画面の実装
- ユーザー管理機能
- ロールベースアクセス制御（RBAC）

