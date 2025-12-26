-- ==========================================
-- PRODUCTION RLS POLICY MASTER SCRIPT
-- ==========================================
-- This script acts as the single source of truth for your RLS security.
-- Run this in Supabase -> SQL Editor.

-- SECTION 0: Enable RLS Globally
-- ------------------------------------------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- SECTION 1: PROFILES
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Public view profiles" ON profiles;
-- Optional: Allow seeing names of other users if needed (e.g. group chat)
CREATE POLICY "Public view profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
CREATE POLICY "Users can delete own profile" ON profiles FOR DELETE USING (auth.uid() = id);


-- SECTION 2: SCHOOLS
-- ------------------------------------------
DROP POLICY IF EXISTS "Public schools are viewable by everyone" ON schools;
CREATE POLICY "Public schools are viewable by everyone" ON schools FOR SELECT USING (true);


-- SECTION 3: SCHOOL MEMBERS
-- ------------------------------------------
DROP POLICY IF EXISTS "Users can view own memberships" ON school_members;
CREATE POLICY "Users can view own memberships" ON school_members FOR SELECT USING (auth.uid() = user_id);

-- Optional: Allow school admins to view their school's members
DROP POLICY IF EXISTS "Admins can view school members" ON school_members;
CREATE POLICY "Admins can view school members" ON school_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM school_members admin_check
    WHERE admin_check.school_id = school_members.school_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
);


-- SECTION 4: GROUPS (Visibility)
-- ------------------------------------------
DROP POLICY IF EXISTS "View groups I belong to" ON groups;
CREATE POLICY "View groups I belong to" ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Public view for search" ON groups;
-- Allow users to see groups if they are PUBLIC (if you have such a flag) or just members.
-- For now, sticking to "Member Only" visibility for privacy + School Admins.
DROP POLICY IF EXISTS "School Admins view all groups" ON groups;
CREATE POLICY "School Admins view all groups" ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = groups.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.role IN ('admin', 'teacher')
  )
);


-- SECTION 5: GROUP MEMBERS (Management)
-- ------------------------------------------
-- 5a. VIEW: See members if you are in the same group
DROP POLICY IF EXISTS "View members of my groups" ON group_members;
CREATE POLICY "View members of my groups" ON group_members FOR SELECT
USING (
  group_id IN (SELECT group_id FROM group_members WHERE user_id = auth.uid()) 
  OR 
  -- Allow School Admins to see members
  EXISTS (
     SELECT 1 FROM groups g
     JOIN school_members sm ON sm.school_id = g.school_id
     WHERE g.id = group_members.group_id
     AND sm.user_id = auth.uid()
     AND sm.role = 'admin'
  )
);

-- 5b. INSERT: Admins, Teachers, Group Admins can add members
DROP POLICY IF EXISTS "Group management insert" ON group_members;
CREATE POLICY "Group management insert" ON group_members FOR INSERT WITH CHECK (
  -- 1. School Staff
  EXISTS (
    SELECT 1 FROM groups g
    JOIN school_members sm ON sm.school_id = g.school_id
    WHERE g.id = group_members.group_id
    AND sm.user_id = auth.uid()
    AND sm.role IN ('admin', 'teacher')
  )
  OR
  -- 2. Group Admin
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
);

-- 5c. DELETE: Admins, Group Admins, or Self (Leave)
DROP POLICY IF EXISTS "Group management delete" ON group_members;
CREATE POLICY "Group management delete" ON group_members FOR DELETE USING (
  -- 1. School Staff
  EXISTS (
    SELECT 1 FROM groups g
    JOIN school_members sm ON sm.school_id = g.school_id
    WHERE g.id = group_members.group_id
    AND sm.user_id = auth.uid()
    AND sm.role IN ('admin', 'teacher')
  )
  OR
  -- 2. Group Admin
  EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = group_members.group_id
    AND gm.user_id = auth.uid()
    AND gm.role = 'admin'
  )
  OR
  -- 3. Leave Group
  user_id = auth.uid()
);


-- SECTION 6: MESSAGES
-- ------------------------------------------
-- 6a. INSERT: Must be sender AND member of group
DROP POLICY IF EXISTS "Send messages to group" ON messages;
CREATE POLICY "Send messages to group" ON messages FOR INSERT WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = messages.group_id
    AND group_members.user_id = auth.uid()
  )
);

-- 6b. SELECT: Must be member of group
DROP POLICY IF EXISTS "View group messages" ON messages;
CREATE POLICY "View group messages" ON messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = messages.group_id
    AND group_members.user_id = auth.uid()
  )
);


-- SECTION 7: ANNOUNCEMENTS
-- ------------------------------------------
DROP POLICY IF EXISTS "See announcements for my schools" ON announcements;
CREATE POLICY "See announcements for my schools" ON announcements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = announcements.school_id
    AND school_members.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "School staff create announcements" ON announcements;
CREATE POLICY "School staff create announcements" ON announcements FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM school_members
    WHERE school_members.school_id = announcements.school_id
    AND school_members.user_id = auth.uid()
    AND school_members.role IN ('admin', 'teacher', 'communications_officer')
  )
);

-- ==========================================
-- ALL POLICIES UPDATED
-- ==========================================
