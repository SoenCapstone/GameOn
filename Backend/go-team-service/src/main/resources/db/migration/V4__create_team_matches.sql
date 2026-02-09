CREATE TABLE IF NOT EXISTS team_allowed_regions (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_team_allowed_regions_team
    ON team_allowed_regions(team_id);

CREATE TABLE IF NOT EXISTS team_matches (
    id UUID PRIMARY KEY,
    match_type VARCHAR(20) NOT NULL,
    home_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    away_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    sport VARCHAR(75),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    match_location VARCHAR(255),
    requires_referee BOOLEAN NOT NULL,
    referee_user_id VARCHAR(255),
    status VARCHAR(30) NOT NULL,
    notes TEXT,
    created_by_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by_user_id VARCHAR(255),
    cancel_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_team_matches_home_team ON team_matches(home_team_id);
CREATE INDEX IF NOT EXISTS idx_team_matches_away_team ON team_matches(away_team_id);
CREATE INDEX IF NOT EXISTS idx_team_matches_status ON team_matches(status);
CREATE INDEX IF NOT EXISTS idx_team_matches_start_time ON team_matches(start_time);

CREATE TABLE IF NOT EXISTS team_match_invites (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES team_matches(id) ON DELETE CASCADE,
    invited_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    invited_by_user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_match_invites_match
    ON team_match_invites(match_id);

CREATE TABLE IF NOT EXISTS team_match_scores (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES team_matches(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    submitted_by_user_id VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_team_match_scores_match
    ON team_match_scores(match_id);
