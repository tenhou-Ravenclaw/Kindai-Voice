-- タイムスタンプをTIMESTAMPTZに移行するスクリプト
-- 既存のデータベースでTIMESTAMP型をTIMESTAMPTZ型に変更する場合に使用
-- 
-- ⚠️ 注意: このスクリプトは既存データを保持しながら型を変更します
-- 実行前に必ずデータベースのバックアップを取得してください

-- ============================================
-- 1. coursesテーブル
-- ============================================
ALTER TABLE courses 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- ============================================
-- 2. lecturesテーブル
-- ============================================
ALTER TABLE lectures 
  ALTER COLUMN scheduled_start_time TYPE TIMESTAMPTZ USING scheduled_start_time AT TIME ZONE 'UTC',
  ALTER COLUMN scheduled_end_time TYPE TIMESTAMPTZ USING scheduled_end_time AT TIME ZONE 'UTC',
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING updated_at AT TIME ZONE 'UTC';

-- ============================================
-- 3. postsテーブル
-- ============================================
ALTER TABLE posts 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC',
  ALTER COLUMN deleted_at TYPE TIMESTAMPTZ USING deleted_at AT TIME ZONE 'UTC';

-- ============================================
-- 4. likesテーブル
-- ============================================
ALTER TABLE likes 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- ============================================
-- 5. summariesテーブル
-- ============================================
ALTER TABLE summaries 
  ALTER COLUMN created_at TYPE TIMESTAMPTZ USING created_at AT TIME ZONE 'UTC';

-- ============================================
-- 確認クエリ（実行後に確認してください）
-- ============================================
-- SELECT 
--   table_name,
--   column_name,
--   data_type
-- FROM information_schema.columns
-- WHERE table_schema = 'public'
--   AND column_name IN ('created_at', 'updated_at', 'scheduled_start_time', 'scheduled_end_time', 'deleted_at')
-- ORDER BY table_name, column_name;

