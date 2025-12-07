-- テストデータ削除スクリプト
-- ⚠️ 注意: このスクリプトはすべてのテストデータを削除します
-- Supabase SQL Editorで実行してください

-- ============================================
-- テストデータの削除（外部キー制約により順序が重要）
-- ============================================

-- いいねデータを削除
DELETE FROM likes 
WHERE post_id IN (
  SELECT p.id 
  FROM posts p
  JOIN lectures l ON p.lecture_id = l.id
  JOIN courses c ON l.course_id = c.id
  WHERE c.code IN ('DB001', 'WEB001', 'ALG001')
);

-- 投稿データを削除
DELETE FROM posts 
WHERE lecture_id IN (
  SELECT l.id 
  FROM lectures l
  JOIN courses c ON l.course_id = c.id
  WHERE c.code IN ('DB001', 'WEB001', 'ALG001')
);

-- 要約データを削除
DELETE FROM summaries 
WHERE lecture_id IN (
  SELECT l.id 
  FROM lectures l
  JOIN courses c ON l.course_id = c.id
  WHERE c.code IN ('DB001', 'WEB001', 'ALG001')
);

-- 講義セッションデータを削除
DELETE FROM lectures 
WHERE course_id IN (
  SELECT id FROM courses 
  WHERE code IN ('DB001', 'WEB001', 'ALG001')
);

-- コースデータを削除
DELETE FROM courses 
WHERE code IN ('DB001', 'WEB001', 'ALG001');

-- ============================================
-- 削除確認
-- ============================================

SELECT '=== 削除後のコース数 ===' AS info;
SELECT COUNT(*) AS course_count FROM courses WHERE code IN ('DB001', 'WEB001', 'ALG001');

SELECT '=== 削除後の講義数 ===' AS info;
SELECT COUNT(*) AS lecture_count 
FROM lectures l
JOIN courses c ON l.course_id = c.id
WHERE c.code IN ('DB001', 'WEB001', 'ALG001');

SELECT '=== 削除後の投稿数 ===' AS info;
SELECT COUNT(*) AS post_count 
FROM posts p
JOIN lectures l ON p.lecture_id = l.id
JOIN courses c ON l.course_id = c.id
WHERE c.code IN ('DB001', 'WEB001', 'ALG001');

