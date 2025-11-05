INSERT INTO public.sport_table (sport_id, sport_name, players_per_team) VALUES
  (1,'Soccer',11),
  (2,'Basketball',5),
  (3,'Volleyball',6),
  (4,'Hockey',6),
  (5,'Tennis',1)
ON CONFLICT DO NOTHING;