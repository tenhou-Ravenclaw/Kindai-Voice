-- Kindai Voice テストデータ作成スクリプト
-- Supabase SQL Editorで実行してください

-- ============================================
-- テスト用コースの作成
-- ============================================

-- コース1: データベース基礎
INSERT INTO courses (code, title, total_sessions, regular_day_of_week, regular_start_time, regular_end_time, first_session_date)
VALUES (
  'DB001',
  'データベース基礎',
  15,
  1, -- 月曜日
  '10:00:00',
  '11:30:00',
  CURRENT_DATE + INTERVAL '1 day' -- 明日を第1回目とする
)
ON CONFLICT (code) DO NOTHING
RETURNING id, code, title;

-- コース2: Web開発入門
INSERT INTO courses (code, title, total_sessions, regular_day_of_week, regular_start_time, regular_end_time, first_session_date)
VALUES (
  'WEB001',
  'Web開発入門',
  15,
  2, -- 火曜日
  '14:00:00',
  '15:30:00',
  CURRENT_DATE + INTERVAL '2 days' -- 明後日を第1回目とする
)
ON CONFLICT (code) DO NOTHING
RETURNING id, code, title;

-- コース3: アルゴリズムとデータ構造
INSERT INTO courses (code, title, total_sessions, regular_day_of_week, regular_start_time, regular_end_time, first_session_date)
VALUES (
  'ALG001',
  'アルゴリズムとデータ構造',
  15,
  3, -- 水曜日
  '10:00:00',
  '11:30:00',
  CURRENT_DATE + INTERVAL '3 days'
)
ON CONFLICT (code) DO NOTHING
RETURNING id, code, title;

-- ============================================
-- テスト用講義セッションの作成
-- ============================================

-- DB001の第1回目（開催中）
INSERT INTO lectures (course_id, session_number, status, scheduled_start_time, scheduled_end_time, is_rescheduled)
SELECT 
  c.id,
  1,
  'active'::lecture_status,
  NOW() - INTERVAL '30 minutes', -- 30分前に開始
  NOW() + INTERVAL '60 minutes',  -- あと60分で終了
  false
FROM courses c
WHERE c.code = 'DB001'
ON CONFLICT (course_id, session_number) DO UPDATE
SET 
  status = 'active'::lecture_status,
  scheduled_start_time = NOW() - INTERVAL '30 minutes',
  scheduled_end_time = NOW() + INTERVAL '60 minutes',
  updated_at = NOW()
RETURNING id, course_id, session_number, status;

-- DB001の第2回目（開催前）
INSERT INTO lectures (course_id, session_number, status, scheduled_start_time, scheduled_end_time, is_rescheduled)
SELECT 
  c.id,
  2,
  'scheduled'::lecture_status,
  (c.first_session_date + INTERVAL '1 week')::date + c.regular_start_time::time,
  (c.first_session_date + INTERVAL '1 week')::date + c.regular_end_time::time,
  false
FROM courses c
WHERE c.code = 'DB001'
ON CONFLICT (course_id, session_number) DO NOTHING
RETURNING id, course_id, session_number, status;

-- WEB001の第1回目（開催中）
INSERT INTO lectures (course_id, session_number, status, scheduled_start_time, scheduled_end_time, is_rescheduled)
SELECT 
  c.id,
  1,
  'active'::lecture_status,
  NOW() - INTERVAL '15 minutes',
  NOW() + INTERVAL '75 minutes',
  false
FROM courses c
WHERE c.code = 'WEB001'
ON CONFLICT (course_id, session_number) DO UPDATE
SET 
  status = 'active'::lecture_status,
  scheduled_start_time = NOW() - INTERVAL '15 minutes',
  scheduled_end_time = NOW() + INTERVAL '75 minutes',
  updated_at = NOW()
RETURNING id, course_id, session_number, status;

-- ALG001の第1回目（開催前）
INSERT INTO lectures (course_id, session_number, status, scheduled_start_time, scheduled_end_time, is_rescheduled)
SELECT 
  c.id,
  1,
  'scheduled'::lecture_status,
  (c.first_session_date)::date + c.regular_start_time::time,
  (c.first_session_date)::date + c.regular_end_time::time,
  false
FROM courses c
WHERE c.code = 'ALG001'
ON CONFLICT (course_id, session_number) DO NOTHING
RETURNING id, course_id, session_number, status;

-- ============================================
-- テスト用投稿データの作成（DB001の第1回目）
-- ============================================

-- DB001の第1回目の講義IDを取得して投稿を作成
DO $$
DECLARE
  lecture_uuid UUID;
BEGIN
  -- DB001の第1回目の講義IDを取得
  SELECT l.id INTO lecture_uuid
  FROM lectures l
  JOIN courses c ON l.course_id = c.id
  WHERE c.code = 'DB001' AND l.session_number = 1;

  -- 投稿を作成
  IF lecture_uuid IS NOT NULL THEN
    INSERT INTO posts (lecture_id, content, like_count) VALUES
      (lecture_uuid, 'データベースの正規化について質問です。第3正規形とBCNFの違いを教えてください。', 5),
      (lecture_uuid, 'SQLのJOINの種類が多くて混乱しています。INNER JOINとOUTER JOINの使い分けを教えてください。', 8),
      (lecture_uuid, 'トランザクションのACID特性について、もう少し詳しく説明していただけますか？', 3),
      (lecture_uuid, 'インデックスの効果的な使い方について知りたいです。', 2),
      (lecture_uuid, 'データベース設計の際、パフォーマンスと正規化のバランスをどう取ればいいですか？', 6),
      (lecture_uuid, 'PostgreSQLとMySQLの違いについて教えてください。', 4),
      (lecture_uuid, 'リレーショナルデータベースとNoSQLの使い分けがわかりません。', 7),
      (lecture_uuid, 'データベースのバックアップとリストアの方法を学びたいです。', 1),
      (lecture_uuid, 'クエリの最適化方法について、具体的な例を交えて説明していただけますか？', 9),
      (lecture_uuid, 'データベースのセキュリティ対策について知りたいです。', 2);
  END IF;
END $$;

-- ============================================
j-- テスト用いいねデータの作成
-- ============================================

-- ランダムにいいねを追加
DO $$
DECLARE
  post_record RECORD;
  user_ids TEXT[] := ARRAY['user-001', 'user-002', 'user-003', 'user-004', 'user-005', 'user-006', 'user-007', 'user-008', 'user-009', 'user-010'];
  random_user TEXT;
  target_like_count INTEGER;
BEGIN
  FOR post_record IN 
    SELECT id, like_count 
    FROM posts 
    WHERE deleted_at IS NULL
  LOOP
    -- 各投稿に対して、いいね数をランダムに設定
    target_like_count := post_record.like_count;
    
    -- いいねデータを作成（重複チェック付き）
    FOR i IN 1..target_like_count LOOP
      random_user := user_ids[1 + floor(random() * array_length(user_ids, 1))::int];
      
      INSERT INTO likes (post_id, user_identifier)
      VALUES (post_record.id, random_user || '-' || i::text)
      ON CONFLICT (post_id, user_identifier) DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- 確認クエリ
-- ============================================

-- 作成されたコース一覧
SELECT '=== コース一覧 ===' AS info;
SELECT code, title, total_sessions, regular_day_of_week, first_session_date 
FROM courses 
ORDER BY code;

-- 開催中の講義一覧
SELECT '=== 開催中の講義 ===' AS info;
SELECT 
  c.code AS course_code,
  c.title AS course_title,
  l.session_number,
  l.status,
  l.scheduled_start_time,
  l.scheduled_end_time
FROM lectures l
JOIN courses c ON l.course_id = c.id
WHERE l.status = 'active'
ORDER BY c.code, l.session_number;

-- 投稿数といいね数の統計
SELECT '=== 投稿統計 ===' AS info;
SELECT 
  c.code AS course_code,
  l.session_number,
  COUNT(p.id) AS post_count,
  SUM(p.like_count) AS total_likes
FROM lectures l
JOIN courses c ON l.course_id = c.id
LEFT JOIN posts p ON l.id = p.lecture_id AND p.deleted_at IS NULL
WHERE l.status = 'active'
GROUP BY c.code, l.session_number
ORDER BY c.code, l.session_number;

