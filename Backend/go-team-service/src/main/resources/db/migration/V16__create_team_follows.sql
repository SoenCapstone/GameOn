CREATE TABLE IF NOT EXISTS team_follows (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_follows_team_user
    ON team_follows(team_id, user_id);

CREATE INDEX IF NOT EXISTS idx_team_follows_user
    ON team_follows(user_id);
