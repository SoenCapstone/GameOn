CREATE TABLE IF NOT EXISTS league_match_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    match_id UUID NOT NULL,

    user_id VARCHAR(255) NOT NULL,

    team_id UUID NOT NULL,

    status VARCHAR(50) NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    CONSTRAINT fk_league_match_members_match
        FOREIGN KEY (match_id)
        REFERENCES league_matches(id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_league_match_members_match_id
    ON league_match_members(match_id);

CREATE INDEX IF NOT EXISTS idx_league_match_members_user_id
    ON league_match_members(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_league_match_members_match_user
    ON league_match_members (match_id, user_id);