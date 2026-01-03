-- ==========================================
-- MESSAGES RLS OPTIMIZATION (REALTIME FIX)
-- ==========================================
-- This script replaces complex/recursive RLS policies on 'messages' with 
-- high-performance security functions to ensure Realtime works reliably.

-- 1. DROP OLD POLICIES
DROP POLICY IF EXISTS "Send messages to group" ON messages;
DROP POLICY IF EXISTS "View group messages" ON messages;

-- 2. CREATE NEW POLICIES (USING SECURITY DEFINER FUNCTIONS)
-- These functions (is_group_member, is_app_admin_v2) should already exist 
-- from our fix_groups_rls_final.sql script.

-- SELECT: Must be member of group or admin
CREATE POLICY "Select messages v2" ON messages FOR SELECT
USING (
  is_group_member(group_id)
  OR is_app_admin_v2()
);

-- INSERT: Must be sender AND member of group
CREATE POLICY "Insert messages v2" ON messages FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() 
  AND (is_group_member(group_id) OR is_app_admin_v2())
);

-- Note: No UPDATE/DELETE policies as messages are usually immutable 
-- in this app's current logic. Add them later if needed.

-- 3. VERIFY REPLICA IDENTITY
-- Realtime needs this for some filter types and detailed payloads.
ALTER TABLE messages REPLICA IDENTITY FULL;

-- 4. VERIFY PUBLICATION
-- (Already member, but just for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE messages;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Table might already be in publication, which is fine
    NULL;
END $$;
