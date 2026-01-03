-- 1. Add last_read_at to group_members
ALTER TABLE public.group_members 
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ DEFAULT now();

-- 2. Create RPC function to get unread counts for a user
CREATE OR REPLACE FUNCTION get_unread_group_counts(p_user_id UUID)
RETURNS TABLE (
  group_id UUID,
  unread_count BIGINT
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gm.group_id,
    COUNT(m.id) AS unread_count
  FROM 
    group_members gm
  JOIN 
    messages m ON m.group_id = gm.group_id
  WHERE 
    gm.user_id = p_user_id
    AND m.created_at > gm.last_read_at
  GROUP BY 
    gm.group_id;
END;
$$;
