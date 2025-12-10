-- POLICY: Strict Group Management
-- Goal: Only Group Admins (role='admin') or the Group Creator can ADD or REMOVE members.

-- 1. Drop previous policies to avoid conflicts
DROP POLICY IF EXISTS "School staff can add group members" ON group_members;
DROP POLICY IF EXISTS "Group Admin can add members" ON group_members;
DROP POLICY IF EXISTS "Group Admin can remove members" ON group_members;

-- 2. CREATE POLICY for INSERT (Adding members)
CREATE POLICY "Group Admin can add members"
ON group_members
FOR INSERT
TO authenticated
WITH CHECK (
  -- Allow if user is the Creator of the group
  EXISTS (
    SELECT 1 FROM groups
    WHERE id = group_members.group_id
    AND created_by = auth.uid()
  )
  OR
  -- Allow if user is an ADMIN of the group
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

-- 3. CREATE POLICY for DELETE (Removing members)
CREATE POLICY "Group Admin can remove members"
ON group_members
FOR DELETE
TO authenticated
USING (
  -- Allow if user is the Creator of the group
  EXISTS (
    SELECT 1 FROM groups
    WHERE id = group_members.group_id
    AND created_by = auth.uid()
  )
  OR
  -- Allow if user is an ADMIN of the group
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
  OR
  -- Allow if user is removing THEMSELVES (Leave Group)
  user_id = auth.uid()
);
