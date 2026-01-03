-- 1. Add last_read_announcements_at to school_members
ALTER TABLE public.school_members
ADD COLUMN IF NOT EXISTS last_read_announcements_at TIMESTAMPTZ DEFAULT now();

-- 2. Create RPC to count unread announcements
CREATE OR REPLACE FUNCTION get_unread_announcements_count(p_school_id UUID, p_user_id UUID)
RETURNS BIGINT
LANGUAGE plpgsql
AS $$
DECLARE
  v_last_read TIMESTAMPTZ;
  v_count BIGINT;
BEGIN
  -- Get user's last read time for this school
  SELECT last_read_announcements_at INTO v_last_read
  FROM school_members
  WHERE school_id = p_school_id AND user_id = p_user_id;

  -- Count announcements created after last read
  SELECT COUNT(*) INTO v_count
  FROM announcements
  WHERE school_id = p_school_id
  AND created_at > COALESCE(v_last_read, '1970-01-01'::timestamptz);

  RETURN v_count;
END;
$$;

-- 3. Create RPC to mark announcements as read
CREATE OR REPLACE FUNCTION mark_announcements_read(p_school_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE school_members
  SET last_read_announcements_at = now()
  WHERE school_id = p_school_id AND user_id = p_user_id;
END;
$$;
