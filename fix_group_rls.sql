-- POLICY: Allow School Staff (Admin, Teacher, Comm Officer) to add members to groups

-- Drop the policy if it already exists to avoid errors on multiple runs
DROP POLICY IF EXISTS "School staff can add group members" ON group_members;

-- Create the new policy for INSERT
CREATE POLICY "School staff can add group members"
ON group_members
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM groups g
    JOIN school_members sm ON sm.school_id = g.school_id
    WHERE g.id = group_members.group_id      -- The group we are inserting into
    AND sm.user_id = auth.uid()              -- The executing user
    AND sm.role IN ('admin', 'teacher', 'communications_officer') -- Allowed roles
  )
);

-- Note: This assumes you also have a policy for SELECT. 
-- If you need staff to be able to REMOVE members as well, you would need a similar DELETE policy.
-- Just in case, here is a DELETE policy using the same logic (Commented out, run if needed):

/*
DROP POLICY IF EXISTS "School staff can remove group members" ON group_members;

CREATE POLICY "School staff can remove group members"
ON group_members
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM groups g
    JOIN school_members sm ON sm.school_id = g.school_id
    WHERE g.id = group_members.group_id
    AND sm.user_id = auth.uid()
    AND sm.role IN ('admin', 'teacher', 'communications_officer')
  )
);
*/
