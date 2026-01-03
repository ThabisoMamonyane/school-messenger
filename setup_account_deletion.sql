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
  
  -- School Ownership: Manual Cascade Deletion
  -- 1. Get IDs of schools owned by this user
  -- We can't use a variable nicely in a delete block, so we delete by subquery.
  
  -- 1.1 Delete MEMBERS of schools owned by this user
  delete from public.school_members 
  where school_id in (select id from public.schools where owner_id = auth.uid());
  
  -- 1.2 Delete ANNOUNCEMENTS for schools owned by this user
  delete from public.announcements 
  where school_id in (select id from public.schools where owner_id = auth.uid());

  -- 1.3 Delete EVENTS for schools owned by this user (if calendar feature exists)
  delete from public.school_events 
  where school_id in (select id from public.schools where owner_id = auth.uid());

  -- 1.4 Delete GROUPS for schools owned by this user
  -- First delete messages in these groups
  delete from public.messages
  where group_id in (
    select id from public.groups 
    where school_id in (select id from public.schools where owner_id = auth.uid())
  );
  
  -- Then delete all memberships in these groups
  delete from public.group_members
  where group_id in (
    select id from public.groups 
    where school_id in (select id from public.schools where owner_id = auth.uid())
  );

  -- Finally delete the groups themselves
  delete from public.groups 
  where school_id in (select id from public.schools where owner_id = auth.uid());

  -- 2. NOW delete the schools themselves
  delete from public.schools where owner_id = auth.uid();
  
  -- Group Memberships (User's personal memberships)
  delete from public.group_members where user_id = auth.uid();
  
  -- School Memberships (Critical for the error encountered)
  delete from public.school_members where user_id = auth.uid();
  
  -- Messages (Sender)
  delete from public.messages where sender_id = auth.uid();
  
  -- Announcements (Author)
  delete from public.announcements where author_id = auth.uid();

  -- Notifications (Recipient)
  delete from public.notifications where user_id = auth.uid();
  
  -- 2. Delete Profile (Data)
  delete from public.profiles where id = auth.uid();
  
  -- 3. Delete Auth User (Login)
  delete from auth.users where id = auth.uid();
end;
$$;

-- Grant functionality to authenticated users
grant execute on function delete_own_account to authenticated;
