CREATE TABLE IF NOT EXISTS public.sport_table
(
    sport_id         BIGINT NOT NULL,
    sport_name       VARCHAR(255) COLLATE pg_catalog."default",
    players_per_team SMALLINT,
    CONSTRAINT sport_table_pkey PRIMARY KEY (sport_id)
);
