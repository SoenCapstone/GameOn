CREATE TABLE teams (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sport VARCHAR(75),
    league_id UUID,
    owner_user_id BIGINT NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    logo_url TEXT,
    location VARCHAR(255),
    max_roster INTEGER CHECK (max_roster IS NULL OR max_roster > 0),
    privacy VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_teams_owner ON teams(owner_user_id);
CREATE INDEX idx_teams_league ON teams(league_id);
CREATE INDEX idx_teams_sport ON teams(sport);
CREATE INDEX idx_teams_name_lower ON teams((LOWER(name)));
CREATE INDEX idx_teams_deleted ON teams(deleted_at);

CREATE TABLE team_members (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_team_members_team_user ON team_members(team_id, user_id);
CREATE INDEX idx_team_members_user ON team_members(user_id);

CREATE TABLE team_invites (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_by_user_id BIGINT NOT NULL,
    invitee_user_id BIGINT,
    invitee_email VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    responded_at TIMESTAMPTZ,
    CHECK (invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL)
);

CREATE UNIQUE INDEX uq_team_invites_user
    ON team_invites(team_id, invitee_user_id)
    WHERE invitee_user_id IS NOT NULL;

CREATE UNIQUE INDEX uq_team_invites_email
    ON team_invites(team_id, LOWER(invitee_email))
    WHERE invitee_email IS NOT NULL;

CREATE INDEX idx_team_invites_status ON team_invites(status);
CREATE INDEX idx_team_invites_expires_at ON team_invites(expires_at);
