-- ===========================================
-- PERMANENT ANNOUNCEMENT AUTHOR FIX
-- ===========================================
-- 1. Ensure Profiles are synced with Auth Metadata
-- This ensures that 'full_name' in public.profiles matches auth metadata
CREATE OR REPLACE FUNCTION public.sync_profile_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    full_name = COALESCE(NEW.raw_user_meta_data->>'full_name', profiles.full_name),
    email = COALESCE(NEW.email, profiles.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- (Optional: Re-apply sync to existing users if needed)
UPDATE public.profiles p
SET full_name = u.raw_user_meta_data->>'full_name'
FROM auth.users u
WHERE p.id = u.id 
AND u.raw_user_meta_data->>'full_name' IS NOT NULL;

-- 2. Force author_id to be auth.uid() for Announcements
-- This prevents any client-side bug from sending the wrong author ID.
ALTER TABLE announcements ALTER COLUMN author_id SET DEFAULT auth.uid();

-- Trigger to ensure author_id is ALWAYS the current user on insert
CREATE OR REPLACE FUNCTION public.set_announcement_author()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.author_id IS NULL OR (NEW.author_id != auth.uid() AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_app_admin = true)) THEN
    NEW.author_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_set_announcement_author ON announcements;
CREATE TRIGGER tr_set_announcement_author
BEFORE INSERT ON announcements
FOR EACH ROW EXECUTE FUNCTION public.set_announcement_author();

-- 3. Data Cleanup: Re-attribute announcements to School Admins if the author is a Parent
-- (Since parents shouldn't be posting, any announcement credited to them is likely an error)
UPDATE announcements a
SET author_id = (
  SELECT user_id 
  FROM school_members 
  WHERE school_id = a.school_id 
  AND LOWER(role::text) = 'admin' 
  LIMIT 1
)
WHERE author_id IN (
  SELECT user_id 
  FROM school_members 
  WHERE LOWER(role::text) = 'parent'
);

-- 4. Enable efficient fetching for AnnouncementsPage
-- Ensure the join on author_id is indexed (usually it is if it's a FK)
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_announcements_school_id ON announcements(school_id);
