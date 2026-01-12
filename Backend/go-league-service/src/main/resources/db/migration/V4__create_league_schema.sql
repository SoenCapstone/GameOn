CREATE TABLE IF NOT EXISTS leagues (
    id UUID PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sport VARCHAR(75) NOT NULL,
    slug VARCHAR(160) NOT NULL UNIQUE,
    location VARCHAR(255),
    region VARCHAR(120),
    owner_user_id BIGINT NOT NULL,
    level VARCHAR(20),
    privacy VARCHAR(20) NOT NULL,
    season_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_leagues_owner ON leagues(owner_user_id);
CREATE INDEX IF NOT EXISTS idx_leagues_sport ON leagues(sport);
CREATE INDEX IF NOT EXISTS idx_leagues_region ON leagues(region);
CREATE INDEX IF NOT EXISTS idx_leagues_privacy ON leagues(privacy);
CREATE INDEX IF NOT EXISTS idx_leagues_archived ON leagues(archived_at);

CREATE TABLE IF NOT EXISTS league_seasons (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    archived_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_league_seasons_league ON league_seasons(league_id);
CREATE INDEX IF NOT EXISTS idx_league_seasons_archived ON league_seasons(archived_at);

CREATE TABLE IF NOT EXISTS league_invites (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    invited_by_user_id VARCHAR(20) NOT NULL,
    invitee_user_id BIGINT,
    invitee_email VARCHAR(255),
    role VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    CHECK (invitee_user_id IS NOT NULL OR invitee_email IS NOT NULL)
);



CREATE UNIQUE INDEX IF NOT EXISTS uq_league_invites_user
    ON league_invites(league_id, invitee_user_id)
    WHERE invitee_user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_league_invites_email
    ON league_invites(league_id, invitee_email)
    WHERE invitee_email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_league_invites_invitee ON league_invites(invitee_user_id);
CREATE INDEX IF NOT EXISTS idx_league_invites_league ON league_invites(league_id);
