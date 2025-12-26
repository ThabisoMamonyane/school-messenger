-- Function to allow users to delete their own account from auth.users
-- This is required because standard RLS cannot delete from the internal auth schema.

create or replace function delete_own_account()
returns void
language plpgsql
security definer
as $$
begin
  -- 1. DELETE DEPENDENT DATA (Manual Cascade)
  -- Deleting these manually ensures we don't hit foreign key violations if ON DELETE CASCADE isn't set.
  
  -- Group Memberships
  delete from public.group_members where user_id = auth.uid();
  
  -- School Memberships (Critical for the error encountered)
  delete from public.school_members where user_id = auth.uid();
  
  -- Messages (Sender)
  delete from public.messages where sender_id = auth.uid();
  
  -- Announcements (Author)
  delete from public.announcements where author_id = auth.uid();
  
  -- 2. Delete Profile (Data)
  delete from public.profiles where id = auth.uid();
  
  -- 3. Delete Auth User (Login)
  delete from auth.users where id = auth.uid();
end;
$$;

-- Grant functionality to authenticated users
grant execute on function delete_own_account to authenticated;
