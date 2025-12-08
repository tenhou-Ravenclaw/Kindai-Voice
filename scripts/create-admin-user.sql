-- 管理者ユーザー作成スクリプト
-- ⚠️ 注意: このスクリプトはSupabase SQL Editorでは実行できません
-- Supabaseダッシュボードの「Authentication」→「Users」から手動で作成してください

-- ============================================
-- 管理者ユーザーの作成方法
-- ============================================

-- 方法1: Supabaseダッシュボードから作成（推奨）
-- 1. Supabaseダッシュボードにログイン
-- 2. プロジェクトを選択
-- 3. 左サイドバーの「Authentication」をクリック
-- 4. 「Users」タブを選択
-- 5. 「Add user」ボタンをクリック
-- 6. 以下の情報を入力：
--    - Email: admin@example.com（任意のメールアドレス）
--    - Password: 任意のパスワード（8文字以上推奨）
--    - Auto Confirm User: ✅ チェックを入れる（メール確認をスキップ）
-- 7. 「Create user」をクリック

-- 方法2: Supabase CLIを使用（開発環境のみ）
-- supabase auth users create admin@example.com --password your_password

-- ============================================
-- 確認クエリ（SQL Editorで実行可能）
-- ============================================

-- 作成されたユーザーを確認（auth.usersテーブルは直接クエリできないため、
-- Supabaseダッシュボードの「Authentication」→「Users」で確認してください）

-- ============================================
-- トラブルシューティング
-- ============================================

-- 問題: 「Invalid login credentials」エラーが表示される
-- 解決策:
-- 1. メールアドレスとパスワードが正しいか確認
-- 2. Supabaseダッシュボードの「Authentication」→「Users」でユーザーが存在するか確認
-- 3. ユーザーが「Email Confirmed」状態になっているか確認
-- 4. Supabase Authの設定で「Email」プロバイダーが有効になっているか確認

-- 問題: ログイン後もログイン画面が表示される
-- 解決策:
-- 1. ブラウザのCookieを確認（開発者ツール → Application → Cookies）
-- 2. `sb-`で始まるCookieが存在するか確認
-- 3. Cookieが存在しない場合は、Supabase Authの設定を確認
-- 4. 「Site URL」と「Redirect URLs」が正しく設定されているか確認

