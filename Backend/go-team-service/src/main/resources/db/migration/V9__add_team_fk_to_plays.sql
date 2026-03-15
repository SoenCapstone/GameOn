ALTER TABLE plays
ADD COLUMN team_id UUID;

ALTER TABLE plays
ADD CONSTRAINT fk_plays_team
FOREIGN KEY (team_id)
REFERENCES teams(id)
ON DELETE CASCADE;

CREATE INDEX idx_plays_team_id ON plays(team_id);
