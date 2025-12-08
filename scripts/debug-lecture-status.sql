-- 講義状態のデバッグ用クエリ
-- Supabase SQL Editorで実行して、講義の状態を確認してください

-- 開催中の講義の詳細情報
SELECT 
  c.code AS course_code,
  c.title AS course_title,
  l.id AS lecture_id,
  l.session_number,
  l.status,
  l.scheduled_start_time,
  l.scheduled_end_time,
  NOW() AS current_time,
  l.scheduled_end_time + INTERVAL '15 minutes' AS grace_period_end_time,
  CASE 
    WHEN l.scheduled_end_time IS NULL THEN '終了時刻未設定'
    WHEN NOW() < (l.scheduled_end_time + INTERVAL '15 minutes') THEN '投稿可能'
    ELSE '投稿受付終了'
  END AS post_status,
  EXTRACT(EPOCH FROM ((l.scheduled_end_time + INTERVAL '15 minutes') - NOW())) / 60 AS remaining_minutes
FROM lectures l
JOIN courses c ON l.course_id = c.id
WHERE l.status = 'active'
ORDER BY c.code, l.session_number;

-- タイムゾーン情報の確認
SELECT 
  current_setting('timezone') AS database_timezone,
  NOW() AS database_now,
  NOW() AT TIME ZONE 'UTC' AS database_now_utc;

