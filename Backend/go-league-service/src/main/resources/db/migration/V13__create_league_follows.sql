CREATE TABLE IF NOT EXISTS league_follows (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_league_follows_league_user
    ON league_follows(league_id, user_id);

CREATE INDEX IF NOT EXISTS idx_league_follows_user
    ON league_follows(user_id);
