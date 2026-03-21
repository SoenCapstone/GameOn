CREATE TABLE team_match_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL,
    team_member_id UUID NOT NULL,
    team_id UUID NOT NULL,
    role VARCHAR(20) NOT NULL,
    attending VARCHAR(20) NOT NULL,
    joined_at TIMESTAMP,

    CONSTRAINT fk_match FOREIGN KEY(match_id) REFERENCES team_matches(id),
    CONSTRAINT fk_team_member FOREIGN KEY(team_member_id) REFERENCES team_members(id)
);

CREATE INDEX idx_team_match ON team_match_members(match_id);
CREATE INDEX idx_team_team_match ON team_match_members(match_id, team_id);
CREATE INDEX idx_attending_status ON team_match_members(attending);