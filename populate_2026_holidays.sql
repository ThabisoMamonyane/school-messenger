-- =============================================
-- 2026 HOLIDAYS DATA INSERTION
-- =============================================

-- IMPORTANT: This script assumes update_calendar_holidays.sql has been run first.

-- Clear existing holidays to prevent duplicates if re-run
DELETE FROM school_events WHERE is_all_schools = true;

-- 1. Insert Public Holidays 2026 (Global)
INSERT INTO school_events (title, event_date, type, is_all_schools, created_by) VALUES
('New Year''s Day', '2026-01-01', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Human Rights Day', '2026-03-21', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Good Friday', '2026-04-03', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Family Day', '2026-04-06', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Freedom Day', '2026-04-27', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Workers'' Day', '2026-05-01', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Youth Day', '2026-06-16', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('National Women''s Day', '2026-08-09', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Women''s Day Observed', '2026-08-10', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Heritage Day', '2026-09-24', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Day of Reconciliation', '2026-12-16', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Christmas Day', '2026-12-25', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('Day of Goodwill', '2026-12-26', 'public_holiday', true, (SELECT id FROM auth.users LIMIT 1));

-- 2. Insert School Holidays / Term Dates 2026 (Global/Universal)
INSERT INTO school_events (title, description, event_date, type, is_all_schools, created_by) VALUES
('School Opens (Learners)', 'Term 1 starts', '2026-01-14', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Closes', 'End of Term 1', '2026-03-27', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Opens (Learners)', 'Term 2 starts', '2026-04-08', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Closes', 'End of Term 2', '2026-06-26', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Opens (Learners)', 'Term 3 starts', '2026-07-21', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Closes', 'End of Term 3', '2026-09-23', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Opens (Learners)', 'Term 4 starts', '2026-10-06', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Closes', 'End of Term 4', '2026-12-09', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1));

-- 3. Insert School Holiday Periods (Ranges for Shading)
-- These use the end_date column to cover the entire break period
INSERT INTO school_events (title, description, event_date, end_date, type, is_all_schools, created_by) VALUES
('School Holiday', 'Term 1 Break', '2026-03-28', '2026-04-07', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Holiday', 'Term 2 Break', '2026-06-27', '2026-07-20', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Holiday', 'Term 3 Break', '2026-09-24', '2026-10-05', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1)),
('School Holiday', 'Term 4 Break', '2026-12-10', '2026-12-31', 'school_holiday', true, (SELECT id FROM auth.users LIMIT 1));

-- =============================================
-- DATA INSERTION COMPLETE
-- =============================================
