-- ===========================================
-- TIGHTEN GROUP VISIBILITY RLS
-- ===========================================
-- This script restricts visibility of groups and memberships 
-- to only those who are actually in the group, plus School Admins.

-- 1. Helper Function: is_school_admin
CREATE OR REPLACE FUNCTION public.is_school_admin(s_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM school_members
    WHERE school_id = s_id
    AND user_id = auth.uid()
    AND LOWER(role::text) = 'admin'
  );
$$;

-- 2. Update GROUPS SELECT Policy
DROP POLICY IF EXISTS "Select groups v3" ON groups;
CREATE POLICY "Select groups v4" ON groups FOR SELECT
USING (
  is_school_admin(school_id)
  OR is_group_member(id)
  OR is_app_admin_v2()
);

-- 3. Update GROUP_MEMBERS SELECT Policy
DROP POLICY IF EXISTS "Select memberships v3" ON group_members;
CREATE POLICY "Select memberships v4" ON group_members FOR SELECT
USING (
  user_id = auth.uid() -- View own
  OR is_group_member(group_id) -- View fellow members
  OR is_school_admin(get_group_school_id(group_id)) -- ONLY School Admin can view all
  OR is_app_admin_v2() -- App Admin view all
);

-- Note: We keep is_school_staff for INSERT/DELETE as teachers 
-- should still be able to create groups or manage members of groups they lead.
-- (Creation adds them as admin, which gives them is_group_member access).
