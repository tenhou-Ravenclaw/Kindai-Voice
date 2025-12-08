-- Kindai Voice データベーススキーマ
-- Supabase PostgreSQL 用テーブル定義

-- ============================================
-- ENUM型の定義
-- ============================================

-- 講義セッションのステータス
CREATE TYPE lecture_status AS ENUM (
  'scheduled',  -- 開催前
  'active',     -- 開催中
  'ended',      -- 終了
  'summarized'  -- 要約済み
);

-- ============================================
-- テーブル定義
-- ============================================

-- テーブル1: courses（講義コース情報）
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(10) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  total_sessions INTEGER NOT NULL DEFAULT 15,
  regular_day_of_week INTEGER CHECK (regular_day_of_week >= 0 AND regular_day_of_week <= 6),
  regular_start_time TIME,
  regular_end_time TIME,
  first_session_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- テーブル2: lectures（各回の講義セッション情報）
CREATE TABLE lectures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_number INTEGER NOT NULL CHECK (session_number >= 1 AND session_number <= 15),
  status lecture_status NOT NULL DEFAULT 'scheduled',
  scheduled_start_time TIMESTAMPTZ,
  scheduled_end_time TIMESTAMPTZ,
  is_rescheduled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(course_id, session_number)
);

-- テーブル3: posts（投稿データ）
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL REFERENCES lectures(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (LENGTH(content) <= 200),
  like_count INTEGER NOT NULL DEFAULT 0 CHECK (like_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- テーブル4: likes（いいねデータ）
CREATE TABLE likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_identifier VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(post_id, user_identifier)
);

-- テーブル5: summaries（AI要約データ）
CREATE TABLE summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID NOT NULL UNIQUE REFERENCES lectures(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  total_posts_count INTEGER CHECK (total_posts_count >= 0),
  total_likes_count INTEGER CHECK (total_likes_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- インデックス定義
-- ============================================

-- coursesテーブルのインデックス
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_courses_regular_day ON courses(regular_day_of_week);

-- lecturesテーブルのインデックス
CREATE INDEX idx_lectures_course_id ON lectures(course_id);
CREATE INDEX idx_lectures_course_session ON lectures(course_id, session_number);
CREATE INDEX idx_lectures_status ON lectures(status);
CREATE INDEX idx_lectures_scheduled_start ON lectures(scheduled_start_time);
CREATE INDEX idx_lectures_rescheduled ON lectures(is_rescheduled);

-- postsテーブルのインデックス
CREATE INDEX idx_posts_lecture_id ON posts(lecture_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_like_count ON posts(like_count DESC);
CREATE INDEX idx_posts_deleted_at ON posts(deleted_at) WHERE deleted_at IS NULL;

-- likesテーブルのインデックス
CREATE INDEX idx_likes_post_id ON likes(post_id);
CREATE INDEX idx_likes_user_identifier ON likes(user_identifier);
CREATE UNIQUE INDEX idx_likes_post_user_unique ON likes(post_id, user_identifier);

-- summariesテーブルのインデックス
CREATE UNIQUE INDEX idx_summaries_lecture_id ON summaries(lecture_id);

-- ============================================
-- トリガー関数（updated_at自動更新）
-- ============================================

-- updated_atを自動更新する関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- coursesテーブルのupdated_at自動更新トリガー
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- lecturesテーブルのupdated_at自動更新トリガー
CREATE TRIGGER update_lectures_updated_at
  BEFORE UPDATE ON lectures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Row Level Security (RLS) 設定
-- ============================================

-- 匿名アクセスを許可するため、RLSは無効化
-- （PRDでは認証なしの匿名投稿を前提としているため）

-- 必要に応じて、将来的にRLSを有効化する場合は以下をコメントアウト
-- ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE summaries ENABLE ROW LEVEL SECURITY;

-- ============================================
-- コメント（テーブル説明）
-- ============================================

COMMENT ON TABLE courses IS '講義コース情報（15回分の共通情報）';
COMMENT ON TABLE lectures IS '各回の講義セッション情報（1-15回目）';
COMMENT ON TABLE posts IS '投稿データ（Phase 3で物理削除）';
COMMENT ON TABLE likes IS 'いいねデータ（Phase 3で物理削除）';
COMMENT ON TABLE summaries IS 'AI要約データ（永続保存）';

COMMENT ON COLUMN courses.regular_day_of_week IS '定期開催曜日（0=日曜、1=月曜、...、6=土曜）';
COMMENT ON COLUMN lectures.status IS '講義セッションの状態（scheduled/active/ended/summarized）';
COMMENT ON COLUMN lectures.is_rescheduled IS '日程変更フラグ（TRUE=定期スケジュールから変更済み）';
COMMENT ON COLUMN posts.like_count IS 'いいね数（リアルタイム更新）';
COMMENT ON COLUMN posts.deleted_at IS '削除日時（Phase 3で物理削除前に記録）';
COMMENT ON COLUMN likes.user_identifier IS 'ユーザー識別子（LocalStorageのUUID）';

