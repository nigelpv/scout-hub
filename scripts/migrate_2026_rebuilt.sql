-- ============================================================
-- Migration: 2026 REBUILT Game — scouting_entries & pit_scouting
-- Run this against your Supabase project SQL editor.
-- ============================================================

-- ---------------------------------------------------------------
-- scouting_entries: Remove old columns
-- ---------------------------------------------------------------
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS auto_preload;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS auto_preload_scored;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS auto_preload_count;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS climb_stability;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS fuel_beaching;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS fuel_beaching_type;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS avg_balls_scored_per_cycle;
ALTER TABLE scouting_entries DROP COLUMN IF EXISTS is_passer_bot;

-- ---------------------------------------------------------------
-- scouting_entries: Add new columns
-- ---------------------------------------------------------------
ALTER TABLE scouting_entries
    ADD COLUMN IF NOT EXISTS starting_position  TEXT    NOT NULL DEFAULT 'hub',
    ADD COLUMN IF NOT EXISTS hoppers_passed_auto INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS hoppers_passed      INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS herds_fuel_through_trench BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS driver_skill        INTEGER NOT NULL DEFAULT 3,
    ADD COLUMN IF NOT EXISTS disabled_or_shut_down BOOLEAN NOT NULL DEFAULT FALSE;

-- ---------------------------------------------------------------
-- scouting_entries: Migrate / change existing column types
--   defense_type     : was TEXT enum, now stored as JSON array text
--   beaching_type    : was TEXT enum (fuel_beaching_type), now JSON array text
--   climb_result     : was 'none'|'low'|'mid'|'high', now 'none'|'L1'|'L2'|'L3'
-- ---------------------------------------------------------------

-- Convert defense_type to JSON array (old single-value rows get wrapped in an array)
UPDATE scouting_entries
SET defense_type = CASE
    WHEN defense_type IS NULL OR defense_type = 'none'  THEN '[]'
    ELSE json_build_array(defense_type)::text
END
WHERE defense_type NOT LIKE '[%';

-- Rename fuel_beaching_type → beaching_type as a JSON array column
-- (column was already dropped above if it existed as fuel_beaching_type)
ALTER TABLE scouting_entries ADD COLUMN IF NOT EXISTS beaching_type TEXT NOT NULL DEFAULT '[]';

-- Migrate old climb_result values to new L-level names
UPDATE scouting_entries SET climb_result = 'L1' WHERE climb_result = 'low';
UPDATE scouting_entries SET climb_result = 'L2' WHERE climb_result = 'mid';
UPDATE scouting_entries SET climb_result = 'L3' WHERE climb_result = 'high';

-- ---------------------------------------------------------------
-- pit_scouting: Remove old columns
-- ---------------------------------------------------------------
ALTER TABLE pit_scouting DROP COLUMN IF EXISTS estimated_points;
ALTER TABLE pit_scouting DROP COLUMN IF EXISTS is_passer_bot;

-- ---------------------------------------------------------------
-- pit_scouting: Rename max_balls → balls_per_second
-- ---------------------------------------------------------------
ALTER TABLE pit_scouting RENAME COLUMN max_balls TO balls_per_second;

-- ---------------------------------------------------------------
-- pit_scouting: Add new columns
-- ---------------------------------------------------------------
ALTER TABLE pit_scouting
    ADD COLUMN IF NOT EXISTS can_pass_fuel   TEXT    NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS can_bulldoze_fuel BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS front_photo     BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS back_photo      BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS notes           TEXT    NOT NULL DEFAULT '';

-- ---------------------------------------------------------------
-- pit_scouting: Migrate climb level names
-- ---------------------------------------------------------------
UPDATE pit_scouting SET robot_climb = 'L1' WHERE robot_climb = 'low';
UPDATE pit_scouting SET robot_climb = 'L2' WHERE robot_climb = 'mid';
UPDATE pit_scouting SET robot_climb = 'L3' WHERE robot_climb = 'high';

-- Done!
SELECT 'Migration complete.' AS status;
