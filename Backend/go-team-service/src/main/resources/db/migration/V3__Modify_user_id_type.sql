ALTER TABLE teams
ALTER COLUMN owner_user_id TYPE VARCHAR(255)
USING owner_user_id::VARCHAR;

ALTER TABLE team_members
ALTER COLUMN user_id TYPE VARCHAR(255)
USING user_id::VARCHAR;

ALTER TABLE team_invites
ALTER COLUMN invited_by_user_id TYPE VARCHAR(255)
USING invited_by_user_id::VARCHAR;

ALTER TABLE team_invites
ALTER COLUMN invitee_user_id TYPE VARCHAR(255)
USING invitee_user_id::VARCHAR;
