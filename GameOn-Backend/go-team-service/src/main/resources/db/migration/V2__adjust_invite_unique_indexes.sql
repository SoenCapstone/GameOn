DROP INDEX IF EXISTS uq_team_invites_user;
DROP INDEX IF EXISTS uq_team_invites_email;

CREATE UNIQUE INDEX uq_team_invites_user_pending
    ON team_invites(team_id, invitee_user_id)
    WHERE invitee_user_id IS NOT NULL AND status = 'PENDING';

CREATE UNIQUE INDEX uq_team_invites_email_pending
    ON team_invites(team_id, LOWER(invitee_email))
    WHERE invitee_email IS NOT NULL AND status = 'PENDING';
