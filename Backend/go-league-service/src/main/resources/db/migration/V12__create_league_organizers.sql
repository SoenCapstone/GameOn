CREATE TABLE IF NOT EXISTS league_organizers (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id  UUID         NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    user_id    VARCHAR(255) NOT NULL,
    joined_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
    CONSTRAINT uq_league_organizer UNIQUE (league_id, user_id)
);

CREATE INDEX idx_league_organizers_league ON league_organizers(league_id);
CREATE INDEX idx_league_organizers_user   ON league_organizers(user_id);

CREATE TABLE IF NOT EXISTS league_organizer_invites (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    league_id           UUID         NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
    invitee_user_id     VARCHAR(255) NOT NULL,
    invited_by_user_id  VARCHAR(255) NOT NULL,
    status              VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
    responded_at        TIMESTAMPTZ,
    created_at          TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_org_invites_league  ON league_organizer_invites(league_id);
CREATE INDEX idx_org_invites_invitee ON league_organizer_invites(invitee_user_id);