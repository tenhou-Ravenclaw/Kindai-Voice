-- Enable Supabase Realtime for posts table
-- This allows real-time updates when posts are inserted, updated, or deleted
-- Run this in your Supabase SQL Editor

-- Enable Realtime for posts table
ALTER PUBLICATION supabase_realtime ADD TABLE posts;

-- Enable Realtime for likes table (for real-time like updates)
ALTER PUBLICATION supabase_realtime ADD TABLE likes;
