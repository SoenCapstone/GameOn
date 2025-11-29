INSERT INTO public.sport_table (sport_name, players_per_team) VALUES
    ('Soccer', 11),
    ('Basketball', 5),
    ('Volleyball', 6),
    ('Hockey', 6),
    ('Tennis', 1)
ON CONFLICT (sport_name) DO NOTHING;