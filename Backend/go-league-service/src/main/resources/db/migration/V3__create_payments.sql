CREATE TABLE payments (
  id UUID PRIMARY KEY,
  user_id VARCHAR(200) NOT NULL,
  league_id UUID NOT NULL,
  amount BIGINT NOT NULL,
  currency VARCHAR(3) NOT NULL,
  status VARCHAR(30) NOT NULL,
  stripe_payment_intent_id VARCHAR(100) UNIQUE,
  succeeded_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_league_id ON payments(league_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
