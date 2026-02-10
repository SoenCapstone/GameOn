BEGIN;

CREATE TABLE IF NOT EXISTS plays (
  id uuid PRIMARY KEY,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS play_nodes (
  id uuid PRIMARY KEY,
  play_id uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,

  type text NOT NULL,
  associated_player_id text,

  x double precision NOT NULL,
  y double precision NOT NULL,
  size double precision NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_play_nodes_play_id_id
  ON play_nodes (play_id, id);

CREATE INDEX IF NOT EXISTS ix_play_nodes_play_id
  ON play_nodes (play_id);

CREATE INDEX IF NOT EXISTS ix_play_nodes_associated_player_id
  ON play_nodes (associated_player_id);

CREATE TABLE IF NOT EXISTS play_edges (
  id uuid PRIMARY KEY,
  play_id uuid NOT NULL REFERENCES plays(id) ON DELETE CASCADE,

  from_node_id uuid NOT NULL,
  to_node_id uuid NOT NULL,

  CONSTRAINT chk_play_edges_from_to_not_same
    CHECK (from_node_id <> to_node_id),

  CONSTRAINT fk_play_edges_from_node
    FOREIGN KEY (play_id, from_node_id)
    REFERENCES play_nodes (play_id, id)
    ON DELETE CASCADE,

  CONSTRAINT fk_play_edges_to_node
    FOREIGN KEY (play_id, to_node_id)
    REFERENCES play_nodes (play_id, id)
    ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS ix_play_edges_play_id
  ON play_edges (play_id);

CREATE INDEX IF NOT EXISTS ix_play_edges_from_node_id
  ON play_edges (from_node_id);

CREATE INDEX IF NOT EXISTS ix_play_edges_to_node_id
  ON play_edges (to_node_id);

COMMIT;
