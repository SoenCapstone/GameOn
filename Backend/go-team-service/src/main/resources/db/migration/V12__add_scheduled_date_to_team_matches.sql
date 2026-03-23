ALTER TABLE team_matches
    ADD COLUMN scheduled_date DATE;

UPDATE team_matches
SET scheduled_date = (start_time AT TIME ZONE 'America/Toronto')::date
WHERE scheduled_date IS NULL;

ALTER TABLE team_matches
    ALTER COLUMN scheduled_date SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_team_matches_scheduled_date
    ON team_matches(scheduled_date);
