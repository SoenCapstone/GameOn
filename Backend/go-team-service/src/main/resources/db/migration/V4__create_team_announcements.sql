CREATE TABLE IF NOT EXISTS team_announcements (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id),
    author_user_id VARCHAR(255) NOT NULL,
    title VARCHAR(120),
    content VARCHAR(2000) NOT NULL,
    scope VARCHAR(30) NOT NULL DEFAULT 'MEMBERS_ONLY',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_announcements_team_id_created_at ON team_announcements(team_id, created_at DESC);
