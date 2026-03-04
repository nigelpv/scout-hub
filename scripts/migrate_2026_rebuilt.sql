-- ============================================================
-- Migration: 2026 REBUILT Game — scouting_entries & pit_scouting
--
-- Confirmed current DB schema (from Supabase table view):
--
-- scouting_entries columns:
--   id, event, match_number, team_number, scout_name, timestamp,
--   auto_cycles, auto_preload, auto_preload_scored, auto_preload_count,
--   auto_climb, auto_obstacle, teleop_cycles, defense_type,
--   defense_location, defense_effectiveness, defense_played,
--   shooting_range, teleop_obstacle, fuel_beaching, fuel_beaching_type,
--   avg_balls_scored_per_cycle, is_passer_bot,
--   climb_result, climb_position, climb_stability, notes
--
-- pit_scouting columns:
--   team_number, auto_climb, robot_climb, max_balls,
--   can_go_under_trench, can_go_over_bump, timestamp, created_at,
--   estimated_points, scout_name, event, intake_type,
--   shooter_type, is_passer_bot
--
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor).
-- ============================================================

-- ==============================================================
-- SECTION 1: scouting_entries
-- ==============================================================

-- --------------------------------------------------------------
-- 1a. Drop removed columns
-- --------------------------------------------------------------
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS auto_preload;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS auto_preload_scored;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS auto_preload_count;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS climb_stability;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS fuel_beaching;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS fuel_beaching_type;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS avg_balls_scored_per_cycle;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS is_passer_bot;

-- --------------------------------------------------------------
-- 1b. Add new columns
-- --------------------------------------------------------------
ALTER TABLE scouting_entries
    ADD COLUMN IF NOT EXISTS starting_position         TEXT    NOT NULL DEFAULT 'hub',
    ADD COLUMN IF NOT EXISTS hoppers_passed_auto        INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hoppers_passed             INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS beaching_type             TEXT    NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS herds_fuel_through_trench  BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS driver_skill               INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS disabled_or_shut_down      BOOLEAN NOT NULL DEFAULT FALSE;

-- --------------------------------------------------------------
-- 1c. Convert defense_type from a single TEXT value to a JSON
--     array string.  Existing rows with 'none' become '[]'.
--     Existing rows with a real value (e.g. 'pushing') become
--     '["pushing"]'.  Rows already in array format are skipped.
-- --------------------------------------------------------------
UPDATE scouting_entries
SET defense_type = CASE
    WHEN defense_type IS NULL OR defense_type = 'none' THEN '[]'
    ELSE json_build_array(defense_type)::text
END
WHERE defense_type NOT LIKE '[%';

-- --------------------------------------------------------------
-- 1d. Migrate climb_result values to L-level names
--     old: 'low' | 'mid' | 'high'
--     new: 'L1'  | 'L2'  | 'L3'
-- --------------------------------------------------------------
UPDATE scouting_entries SET climb_result = 'L1' WHERE climb_result = 'low';
UPDATE scouting_entries SET climb_result = 'L2' WHERE climb_result = 'mid';
UPDATE scouting_entries SET climb_result = 'L3' WHERE climb_result = 'high';


-- ==============================================================
-- SECTION 2: pit_scouting
-- ==============================================================

-- --------------------------------------------------------------
-- 2a. Drop removed columns
-- --------------------------------------------------------------
ALTER TABLE pit_scouting DROP COLUMN IF EXISTS estimated_points;
ALTER TABLE pit_scouting DROP COLUMN IF EXISTS is_passer_bot;

-- --------------------------------------------------------------
-- 2b. Rename max_balls → balls_per_second
--     RENAME COLUMN has no IF EXISTS; the DO block makes it safe
--     to re-run (skips silently if already renamed).
-- --------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pit_scouting' AND column_name = 'max_balls'
    ) THEN
        ALTER TABLE pit_scouting RENAME COLUMN max_balls TO balls_per_second;
    END IF;
END $$;

-- --------------------------------------------------------------
-- 2c. Add new columns
-- --------------------------------------------------------------
ALTER TABLE pit_scouting
    ADD COLUMN IF NOT EXISTS can_pass_fuel      TEXT    NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS can_bulldoze_fuel   BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS front_photo         BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS back_photo          BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notes               TEXT    NOT NULL DEFAULT '';

-- --------------------------------------------------------------
-- 2d. Migrate robot_climb values to L-level names
--     old: 'low' | 'mid' | 'high'
--     new: 'L1'  | 'L2'  | 'L3'
-- --------------------------------------------------------------
UPDATE pit_scouting SET robot_climb = 'L1' WHERE robot_climb = 'low';
UPDATE pit_scouting SET robot_climb = 'L2' WHERE robot_climb = 'mid';
UPDATE pit_scouting SET robot_climb = 'L3' WHERE robot_climb = 'high';


-- Done!
SELECT 'Migration complete.' AS status;
