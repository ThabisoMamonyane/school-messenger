-- PRODUCTION RLS FIX: ANNOUNCEMENTS
-- This script fixes the "new row violates row-level security policy" error 
-- by making the policies more robust, support App Admins, and avoid syntax ambiguity.

-- SECTION 7: ANNOUNCEMENTS (REVISED)
-- ------------------------------------------

-- 1. SELECT POLICY
DROP POLICY IF EXISTS "See announcements for my schools" ON announcements;
CREATE POLICY "See announcements for my schools" ON announcements FOR SELECT
USING (
  -- Either a member of the school
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_id = announcements.school_id
    AND user_id = auth.uid()
  )
  OR
  -- Or an App Admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_app_admin = true
  )
);

-- 2. INSERT POLICY
DROP POLICY IF EXISTS "School staff create announcements" ON announcements;
CREATE POLICY "School staff create announcements" ON announcements FOR INSERT WITH CHECK (
  -- Staff member with appropriate role
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_id = announcements.school_id
    AND user_id = auth.uid()
    AND LOWER(role::text) IN ('admin', 'teacher', 'communications_officer')
  )
  OR
  -- App Admins can post anywhere
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_app_admin = true
  )
);

-- 3. UPDATE/DELETE POLICY (Adding for completeness and management)
DROP POLICY IF EXISTS "Authors and admins manage announcements" ON announcements;
CREATE POLICY "Authors and admins manage announcements" ON announcements FOR ALL
USING (
  -- Either the original author
  author_id = auth.uid()
  OR
  -- Or a school admin
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_id = announcements.school_id
    AND user_id = auth.uid()
    AND LOWER(role::text) = 'admin'
  )
  OR
  -- Or an App Admin
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND is_app_admin = true
  )
);
