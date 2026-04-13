ALTER TABLE league_match_members
    ADD COLUMN IF NOT EXISTS role VARCHAR(50);
