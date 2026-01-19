CREATE TABLE IF NOT EXISTS league_teams (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_league_teams_league_team ON league_teams(league_id, team_id);
CREATE INDEX IF NOT EXISTS idx_league_teams_team ON league_teams(team_id);

CREATE TABLE IF NOT EXISTS league_team_invites (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    team_id UUID NOT NULL,
    invited_by_user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_league_team_invites_league ON league_team_invites(league_id);
CREATE INDEX IF NOT EXISTS idx_league_team_invites_team ON league_team_invites(team_id);
CREATE INDEX IF NOT EXISTS idx_league_team_invites_status ON league_team_invites(status);
CREATE UNIQUE INDEX IF NOT EXISTS uq_league_team_invites_pending
    ON league_team_invites(league_id, team_id)
    WHERE status = 'PENDING';
