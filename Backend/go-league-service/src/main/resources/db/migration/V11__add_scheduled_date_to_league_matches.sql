ALTER TABLE league_matches
    ADD COLUMN scheduled_date DATE;

UPDATE league_matches
SET scheduled_date = (start_time AT TIME ZONE 'America/Toronto')::date
WHERE scheduled_date IS NULL;

ALTER TABLE league_matches
    ALTER COLUMN scheduled_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_league_matches_scheduled_date
    ON league_matches(scheduled_date);
