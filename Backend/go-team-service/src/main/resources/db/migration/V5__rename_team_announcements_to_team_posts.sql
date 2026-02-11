ALTER TABLE IF EXISTS team_announcements RENAME TO team_posts;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relname = 'idx_team_announcements_team_id_created_at'
  ) THEN
    ALTER INDEX idx_team_announcements_team_id_created_at
      RENAME TO idx_team_posts_team_id_created_at;
  END IF;
END $$;

ALTER TABLE team_posts RENAME COLUMN content TO body;

ALTER TABLE team_posts ALTER COLUMN title TYPE VARCHAR(200);
ALTER TABLE team_posts ALTER COLUMN body  TYPE VARCHAR(1000);

ALTER TABLE team_posts
  ADD COLUMN IF NOT EXISTS author_name VARCHAR(255) NOT NULL DEFAULT '';

ALTER TABLE team_posts
  ADD COLUMN IF NOT EXISTS author_role VARCHAR(30) NOT NULL DEFAULT '';

UPDATE team_posts SET scope = 'MEMBERS' WHERE scope = 'MEMBERS_ONLY';

ALTER TABLE team_posts ALTER COLUMN scope SET DEFAULT 'MEMBERS';

CREATE INDEX IF NOT EXISTS idx_team_posts_team_id_created_at
  ON team_posts(team_id, created_at DESC);
