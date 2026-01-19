CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sport VARCHAR(75),
    -- league_id UUID,
    scope VARCHAR(50),
    owner_user_id BIGINT NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    logo_url TEXT,
    location VARCHAR(255),
    max_roster INTEGER CHECK (max_roster IS NULL OR max_roster > 0),
    privacy VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_teams_sport ON teams(sport);
CREATE INDEX IF NOT EXISTS idx_teams_name_lower ON teams(name);
CREATE INDEX IF NOT EXISTS idx_teams_deleted ON teams(deleted_at);


CREATE TABLE IF NOT EXISTS team_members (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_members_team_user
    ON team_members(team_id, user_id);

CREATE INDEX IF NOT EXISTS idx_team_members_user
    ON team_members(user_id);


CREATE TABLE IF NOT EXISTS team_invites (
    id UUID PRIMARY KEY,
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_by_user_id BIGINT NOT NULL,
    invitee_user_id BIGINT,
    invitee_email VARCHAR(255),
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    responded_at TIMESTAMP,
    CHECK (invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_invites_user
    ON team_invites(team_id, invitee_user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_invites_email
    ON team_invites(team_id, invitee_email);

CREATE INDEX IF NOT EXISTS idx_team_invites_status
    ON team_invites(status);

CREATE INDEX IF NOT EXISTS idx_team_invites_expires_at
    ON team_invites(expires_at);
