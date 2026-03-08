CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    street VARCHAR(255) NOT NULL,
    city VARCHAR(120) NOT NULL,
    province VARCHAR(120) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(120) NOT NULL DEFAULT 'Canada',
    region VARCHAR(120) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    google_place_id VARCHAR(255),
    created_by_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_venues_google_place_id UNIQUE (google_place_id)
);

CREATE INDEX IF NOT EXISTS idx_venues_region ON venues(region);
CREATE INDEX IF NOT EXISTS idx_venues_created_by ON venues(created_by_user_id);

ALTER TABLE team_matches
    ADD COLUMN IF NOT EXISTS venue_id UUID REFERENCES venues(id);

CREATE INDEX IF NOT EXISTS idx_team_matches_venue_id ON team_matches(venue_id);
