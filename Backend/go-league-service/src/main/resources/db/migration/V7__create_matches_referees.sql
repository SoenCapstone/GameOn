CREATE TABLE IF NOT EXISTS league_matches (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    home_team_id UUID NOT NULL,
    away_team_id UUID NOT NULL,
    sport VARCHAR(75),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    match_location VARCHAR(255),
    requires_referee BOOLEAN NOT NULL,
    referee_user_id VARCHAR(255),
    status VARCHAR(30) NOT NULL,
    created_by_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cancelled_at TIMESTAMP,
    cancelled_by_user_id VARCHAR(255),
    cancel_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_league_matches_league ON league_matches(league_id);
CREATE INDEX IF NOT EXISTS idx_league_matches_status ON league_matches(status);
CREATE INDEX IF NOT EXISTS idx_league_matches_start_time ON league_matches(start_time);

CREATE TABLE IF NOT EXISTS league_match_scores (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL REFERENCES league_matches(id) ON DELETE CASCADE,
    home_score INTEGER NOT NULL,
    away_score INTEGER NOT NULL,
    submitted_by_user_id VARCHAR(255) NOT NULL,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_league_match_scores_match
    ON league_match_scores(match_id);

CREATE TABLE IF NOT EXISTS referee_profiles (
    user_id VARCHAR(255) PRIMARY KEY,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS referee_sports (
    referee_user_id VARCHAR(255) NOT NULL REFERENCES referee_profiles(user_id) ON DELETE CASCADE,
    sport VARCHAR(75) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referee_sports_user ON referee_sports(referee_user_id);

CREATE TABLE IF NOT EXISTS referee_allowed_regions (
    referee_user_id VARCHAR(255) NOT NULL REFERENCES referee_profiles(user_id) ON DELETE CASCADE,
    region VARCHAR(100) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_referee_regions_user ON referee_allowed_regions(referee_user_id);

CREATE TABLE IF NOT EXISTS ref_invites (
    id UUID PRIMARY KEY,
    match_id UUID NOT NULL,
    referee_user_id VARCHAR(255) NOT NULL,
    invited_by_user_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    responded_at TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_ref_invites_match_ref
    ON ref_invites(match_id, referee_user_id);
