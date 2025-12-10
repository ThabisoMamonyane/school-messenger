-- FINAL FIX: RLS Infinite Recursion
-- This script replaces problematic policies with a robust SECURITY DEFINER function approach.

BEGIN;

-- 1. Drop existing policies to ensure a clean slate
DROP POLICY IF EXISTS "View members of my groups" ON group_members;
DROP POLICY IF EXISTS "View own memberships" ON group_members;

-- 2. Create helper function to safely get my group IDs
-- SECURITY DEFINER: Runs with owner privileges, bypassing RLS to avoid recursion loops.
CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT group_id FROM group_members WHERE user_id = auth.uid();
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_my_group_ids() TO authenticated;

-- 3. Policy: View Own Memberships (Basic)
CREATE POLICY "View own memberships"
ON group_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 4. Policy: View Members of My Groups (Shared View)
-- Uses the secure function to check group overlap without triggering a loop.
CREATE POLICY "View members of my groups"
ON group_members
FOR SELECT
TO authenticated
USING (
  group_id IN (SELECT get_my_group_ids())
);

COMMIT;
