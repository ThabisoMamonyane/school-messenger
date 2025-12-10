-- POLICY: Fix Dashboard Visibility
-- Goal: Ensure users can SEE the groups they belong to.

-- 1. Allow users to view their own memberships (Critical for Dashboard "My Groups")
DROP POLICY IF EXISTS "View own memberships" ON group_members;
CREATE POLICY "View own memberships"
ON group_members
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- 2. Allow users to view details of groups they belong to
DROP POLICY IF EXISTS "View groups I belong to" ON groups;
CREATE POLICY "View groups I belong to"
ON groups
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- 3. Ensure they can see OTHER members in their groups (for Group Chat to work)
-- This might already exist, but let's reinforce it safely.
DROP POLICY IF EXISTS "View members of my groups" ON group_members;
CREATE POLICY "View members of my groups"
ON group_members
FOR SELECT
TO authenticated
USING (
  -- I can see a row if I share a group with that row
  group_id IN (
    SELECT group_id FROM group_members WHERE user_id = auth.uid()
  )
);
