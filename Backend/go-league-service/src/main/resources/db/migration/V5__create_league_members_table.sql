CREATE TABLE league_members (
    id UUID PRIMARY KEY,
    league_id UUID NOT NULL,
    user_id BIGINT NOT NULL,
    role VARCHAR(50) NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_league_id ON league_members(league_id);
CREATE INDEX idx_user_id ON league_members(user_id);

ALTER TABLE league_invites
DROP COLUMN invitee_user_id;

ALTER TABLE league_invites
ALTER COLUMN invitee_email SET NOT NULL;

CREATE INDEX idx_league_invites_invitee_email
ON league_invites (invitee_email);
