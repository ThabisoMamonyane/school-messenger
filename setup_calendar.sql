-- =============================================
-- SCHOOL CALENDAR FEATURE - DATABASE SETUP
-- =============================================
-- Run this in Supabase SQL Editor

-- Create Events Table
CREATE TABLE IF NOT EXISTS school_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE school_events ENABLE ROW LEVEL SECURITY;

-- RLS: All school members can view events
DROP POLICY IF EXISTS "View school events" ON school_events;
CREATE POLICY "View school events" ON school_events
FOR SELECT TO authenticated
USING (
    school_id IN (SELECT school_id FROM school_members WHERE user_id = auth.uid())
);

-- RLS: Only admin/communications_officer can insert
DROP POLICY IF EXISTS "Staff create events" ON school_events;
CREATE POLICY "Staff create events" ON school_events
FOR INSERT TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM school_members
        WHERE school_members.school_id = school_events.school_id
        AND school_members.user_id = auth.uid()
        AND school_members.role IN ('admin', 'communications_officer')
    )
);

-- RLS: Only admin/communications_officer can update
DROP POLICY IF EXISTS "Staff update events" ON school_events;
CREATE POLICY "Staff update events" ON school_events
FOR UPDATE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM school_members
        WHERE school_members.school_id = school_events.school_id
        AND school_members.user_id = auth.uid()
        AND school_members.role IN ('admin', 'communications_officer')
    )
);

-- RLS: Only admin/communications_officer can delete
DROP POLICY IF EXISTS "Staff delete events" ON school_events;
CREATE POLICY "Staff delete events" ON school_events
FOR DELETE TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM school_members
        WHERE school_members.school_id = school_events.school_id
        AND school_members.user_id = auth.uid()
        AND school_members.role IN ('admin', 'communications_officer')
    )
);

-- =============================================
-- CALENDAR SETUP COMPLETE
-- =============================================
