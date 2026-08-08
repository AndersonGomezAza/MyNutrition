-- Stores known to work with the losprecios.co scraper (same HTML template,
-- already spot-checked live for both ara_t2 and d1_t1).

insert into stores (slug, source_path, display_name, active) values
  ('ara', 'ara_t2', 'Ara', true),
  ('d1', 'd1_t1', 'D1', true)
on conflict (slug) do nothing;
