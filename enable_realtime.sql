-- ===========================================
-- ENABLE REALTIME FOR MESSAGES & ANNOUNCEMENTS
-- ===========================================
-- This script enables real-time updates for the key tables in the application.

-- 1. Check if the publication exists, if not create it (Supabase default is often 'supabase_realtime')
-- Note: In most Supabase projects, 'supabase_realtime' already exists.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        CREATE PUBLICATION supabase_realtime;
    END IF;
END $$;

-- 2. Add tables to the publication
-- We add 'messages' for real-time chat and 'announcements' for real-time news.
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
ALTER PUBLICATION supabase_realtime ADD TABLE groups;

-- 3. Verify
-- You can check which tables are in the publication by running:
-- SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
