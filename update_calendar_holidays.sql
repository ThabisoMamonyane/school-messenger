-- =============================================
-- CALENDAR HOLIDAY INTEGRATION - SCHEMA UPDATE
-- =============================================

-- 1. Add 'type' column to distinguish between events and holidays
-- Valid types: 'event', 'public_holiday', 'school_holiday'
ALTER TABLE school_events 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'event';

-- 2. Add constraint to ensure 'type' has valid values
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'valid_event_type') THEN
        ALTER TABLE school_events 
        ADD CONSTRAINT valid_event_type 
        CHECK (type IN ('event', 'public_holiday', 'school_holiday'));
    END IF;
END $$;

-- 3. Add 'is_all_schools' boolean to support universal public holidays
-- If true, the event is visible to all schools regardless of school_id
ALTER TABLE school_events 
ADD COLUMN IF NOT EXISTS is_all_schools BOOLEAN DEFAULT false;

-- 4. Update school_id to be nullable if is_all_schools is true
ALTER TABLE school_events ALTER COLUMN school_id DROP NOT NULL;

-- 5. Update RLS: Standard Select Policy
-- Allow users to see events for their school OR universal events
DROP POLICY IF EXISTS "View school events" ON school_events;
CREATE POLICY "View school events" ON school_events
FOR SELECT TO authenticated
USING (
    is_all_schools = true 
    OR 
    school_id IN (SELECT school_id FROM school_members WHERE user_id = auth.uid())
);

-- =============================================
-- SCHEMA UPDATE COMPLETE
-- =============================================
