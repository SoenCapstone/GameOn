CREATE TABLE league_posts (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL REFERENCES leagues(id),
    author_user_id VARCHAR(255) NOT NULL,
    title VARCHAR(200),
    body VARCHAR(1000) NOT NULL,
    scope VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_league_posts_league_id_created_at
    ON league_posts (league_id, created_at DESC);

CREATE INDEX idx_league_posts_league_id_scope_created_at
    ON league_posts (league_id, scope, created_at DESC);
