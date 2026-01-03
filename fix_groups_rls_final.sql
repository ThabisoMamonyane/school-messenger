-- ==========================================
-- FINAL RLS FIX: RECURSION-FREE SECURITY
-- ==========================================
-- This script uses SECURITY DEFINER functions to break the infinite recursion 
-- loop between groups and group_members tables.

-- 1. SECURITY FUNCTIONS
-- ------------------------------------------
-- These functions run as the database owner (postgres) and do NOT trigger RLS.

CREATE OR REPLACE FUNCTION public.is_school_staff(s_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM school_members
    WHERE school_id = s_id
    AND user_id = auth.uid()
    AND LOWER(role::text) IN ('admin', 'teacher', 'communications_officer')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_group_member(g_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = g_id
    AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_app_admin_v2()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_app_admin = true
  );
$$;

-- 2. GROUPS TABLE POLICIES (REVISED)
-- ------------------------------------------
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff see all groups" ON groups;
DROP POLICY IF EXISTS "Members see joined groups" ON groups;
DROP POLICY IF EXISTS "Staff create groups" ON groups;
DROP POLICY IF EXISTS "Manage groups" ON groups;
DROP POLICY IF EXISTS "View groups I belong to" ON groups;
DROP POLICY IF EXISTS "School Admins view all groups" ON groups;
DROP POLICY IF EXISTS "Staff and members view groups" ON groups;

-- SELECT
CREATE POLICY "Select groups v3" ON groups FOR SELECT
USING (
  is_school_staff(school_id)
  OR is_group_member(id)
  OR is_app_admin_v2()
);

-- INSERT
CREATE POLICY "Insert groups v3" ON groups FOR INSERT WITH CHECK (
  is_school_staff(school_id)
  OR is_app_admin_v2()
);

-- UPDATE/DELETE
CREATE POLICY "Manage groups v3" ON groups FOR ALL
USING (
  created_by = auth.uid()
  OR (
    -- Re-using the staff check but checking for 'admin' specifically
    EXISTS (
      SELECT 1 FROM school_members
      WHERE school_id = groups.school_id
      AND user_id = auth.uid()
      AND LOWER(role::text) = 'admin'
    )
  )
  OR is_app_admin_v2()
);


-- 3. GROUP MEMBERS TABLE POLICIES (REVISED)
-- ------------------------------------------
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "View all memberships" ON group_members;
DROP POLICY IF EXISTS "Insert group members" ON group_members;
DROP POLICY IF EXISTS "Delete group members" ON group_members;
DROP POLICY IF EXISTS "View group members" ON group_members;
DROP POLICY IF EXISTS "View members of my groups" ON group_members;
DROP POLICY IF EXISTS "Add group members" ON group_members;
DROP POLICY IF EXISTS "Remove group members" ON group_members;

-- SELECT
-- Helper to get school_id for a group without RLS interference
CREATE OR REPLACE FUNCTION public.get_group_school_id(g_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT school_id FROM groups WHERE id = g_id;
$$;

CREATE POLICY "Select memberships v3" ON group_members FOR SELECT
USING (
  user_id = auth.uid() -- View own
  OR is_group_member(group_id) -- View fellow members
  OR is_school_staff(get_group_school_id(group_id)) -- Staff view all
  OR is_app_admin_v2() -- Admin view all
);

-- INSERT
CREATE POLICY "Insert memberships v3" ON group_members FOR INSERT WITH CHECK (
  is_school_staff(get_group_school_id(group_id))
  OR (
    -- Group Admin check (Non-recursive because it's a specific row check)
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND LOWER(gm.role::text) = 'admin'
    )
  )
  OR is_app_admin_v2()
);

-- DELETE
CREATE POLICY "Delete memberships v3" ON group_members FOR DELETE
USING (
  user_id = auth.uid() -- Leave
  OR is_school_staff(get_group_school_id(group_id))
  OR (
    -- Group Admin check
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_members.group_id
      AND gm.user_id = auth.uid()
      AND LOWER(gm.role::text) = 'admin'
    )
  )
  OR is_app_admin_v2()
);
