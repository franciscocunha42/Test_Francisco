-- Porto wedding venue seed data
-- Run in Supabase SQL Editor. Replace the value below with your actual wedding ID
-- (find it in Table Editor → weddings → copy the id column).

DO $$
DECLARE
  v_wedding_id uuid := 'YOUR-WEDDING-ID-HERE'::uuid;
BEGIN
  INSERT INTO vendors (wedding_id, name, category, subcategory, status, price_per_person, min_capacity, max_capacity, rating, website, notes)
  VALUES
    (v_wedding_id, 'Indulgent',     'venue', 'praia',      'researching', 105, 25,  200, 4.8, 'https://www.indulgent.pt',    'Events by the sea. A refuge where luxury is discreet, the horizon is infinite and exclusivity is absolute.'),
    (v_wedding_id, 'Torre da Naia', 'venue', 'quinta',     'researching', 140, 50,  300, 4.9,  NULL,                          'Symbol of union between modern and traditional, surrounded by centuries-old walls and pine forests with stunning views.'),
    (v_wedding_id, 'Quinta da Pia', 'venue', 'quinta',     'researching', NULL, NULL, NULL, 5.0, NULL,                        'Splendid quinta surrounded by lush vegetation. Managed by Banquetes António Duarte, renowned for high-quality service.');
END;
$$;
