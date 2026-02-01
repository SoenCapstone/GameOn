ALTER TABLE payments
  ALTER COLUMN league_id DROP NOT NULL;

ALTER TABLE payments
  ADD COLUMN team_id UUID;

ALTER TABLE payments
  ADD CONSTRAINT chk_payment_exactly_one_target
  CHECK (
    (league_id IS NOT NULL AND team_id IS NULL)
    OR
    (league_id IS NULL AND team_id IS NOT NULL)
  );

CREATE INDEX IF NOT EXISTS idx_payments_team_id
  ON payments(team_id);
