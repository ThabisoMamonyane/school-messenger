-- FIX: Infinite Recursion in Group Members Policy
-- Problem: The policy "View members of my groups" checks 'group_members', causing a loop.
-- Solution: Use a "Security Definer" function to check membership safely (bypassing RLS for the check).

-- 1. Drop the problematic recursive policy
DROP POLICY IF EXISTS "View members of my groups" ON group_members;

-- 2. Create a secure helper function
-- This function runs with owner permissions, so it can read 'group_members' without triggering RLS loops.
CREATE OR REPLACE FUNCTION is_group_member_secure(lookup_group_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM group_members
    WHERE group_id = lookup_group_id
    AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Re-create the policy using the secure function
CREATE POLICY "View members of my groups"
ON group_members
FOR SELECT
TO authenticated
USING (
  -- I can see this row if I am a member of the group it belongs to
  is_group_member_secure(group_id)
);

-- Note: "View own memberships" policy (created previously) is fine and can stay.
-- The "View groups I belong to" policy on 'groups' table is also fine once this is fixed.
