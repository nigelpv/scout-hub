-- Migration: Add "A lot of Shooting while intaking" toggles
-- Run this in your Supabase SQL Editor

ALTER TABLE scouting_entries 
ADD COLUMN IF NOT EXISTS shoot_plus_intake_auto BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS shoot_plus_intake_teleop BOOLEAN DEFAULT false;
