// データベースの型定義
// Supabaseの型生成機能を使用する場合は、このファイルを自動生成に置き換えることができます

export type LectureStatus = 'scheduled' | 'active' | 'ended' | 'summarized'

export interface Course {
  id: string
  code: string
  title: string
  total_sessions: number
  regular_day_of_week: number | null
  regular_start_time: string | null
  regular_end_time: string | null
  first_session_date: string | null
  created_at: string
  updated_at: string
}

export interface Lecture {
  id: string
  course_id: string
  session_number: number
  status: LectureStatus
  scheduled_start_time: string | null
  scheduled_end_time: string | null
  is_rescheduled: boolean
  created_at: string
  updated_at: string
}

export interface Post {
  id: string
  lecture_id: string
  content: string
  like_count: number
  created_at: string
  deleted_at: string | null
}

export interface Like {
  id: string
  post_id: string
  user_identifier: string
  created_at: string
}

export interface Summary {
  id: string
  lecture_id: string
  summary_text: string
  total_posts_count: number | null
  total_likes_count: number | null
  created_at: string
}

