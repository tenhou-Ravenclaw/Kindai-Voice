# Database Migrations

This directory contains SQL migration files for the Kindai Voice project.

## Files

### enable_realtime.sql

This migration enables Supabase Realtime for the `posts` and `likes` tables, allowing real-time updates to be broadcast to connected clients.

**When to run:** If you experience issues where new posts don't appear without reloading the page, run this migration in your Supabase SQL Editor.

**How to run:**
1. Open your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Copy and paste the contents of `enable_realtime.sql`
4. Click "Run" to execute the SQL

This migration is safe to run multiple times - if Realtime is already enabled, the command will simply succeed without making changes.
