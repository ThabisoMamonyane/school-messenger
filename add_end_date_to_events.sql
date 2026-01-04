-- =============================================
-- ADD END_DATE SUPPORT TO CALENDAR EVENTS
-- =============================================

-- Add end_date column to support multi-day events and ranges
ALTER TABLE school_events 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update description to clarify usage
COMMENT ON COLUMN school_events.end_date IS 'Optional end date for multi-day events or period shading.';
