-- Porto wedding venue seed data (sourced from casamentos.pt/espacos-casamentos/porto-concelho)
-- Run in Supabase SQL Editor. Replace YOUR-WEDDING-ID-HERE with your actual wedding ID
-- (find it in Table Editor → weddings → copy the id column).
--
-- Alternatively, in the deployed app, click the "Import Porto Venues" button on the
-- Suppliers page — it calls seedDefaultVenues() and is idempotent (skips duplicates).

DO $$
DECLARE
  v_wedding_id uuid := 'YOUR-WEDDING-ID-HERE'::uuid;
BEGIN
  INSERT INTO vendors (wedding_id, name, category, subcategory, status, price_per_person, quoted_price, min_capacity, max_capacity, rating, notes)
  VALUES
    (v_wedding_id, 'Indulgent',                          'venue', 'praia',       'researching', 105,   NULL,  25,  200,  4.8, 'Events by the sea. A refuge where luxury is discreet, the horizon is infinite, and exclusivity is absolute. Porto.'),
    (v_wedding_id, 'Torre da Naia',                      'venue', 'quinta',      'researching', 140,   NULL,  50,  300,  4.9, 'Symbol of union between modern and traditional, surrounded by centuries-old walls and pine forests with stunning views.'),
    (v_wedding_id, 'Quinta da Pia',                      'venue', 'quinta',      'researching', 125,   NULL,  70,  450,  5.0, 'Splendid quinta surrounded by lush vegetation. Managed by Banquetes António Duarte, renowned for high-quality service.'),
    (v_wedding_id, 'Quinta Loureiro Eventos',            'venue', 'quinta',      'researching',  58,   NULL,  40,  180,  4.9, 'Modern and elegant construction in a tranquil environment with natural charm. Responds within 24 hours.'),
    (v_wedding_id, 'Quinta das Carpas',                  'venue', 'quinta',      'researching',  85,   NULL,  60,  250,  4.9, 'Surrounded by abundant nature, offering serenity and elegance with unique decorations. Responds within 24 hours.'),
    (v_wedding_id, 'Quinta do Palácio Rauliana',         'venue', 'quinta',      'researching',  80,   NULL,  20, 1000,  4.9, 'Tropical scenery with greenery and crystal-clear water. Designed for stylish, sophisticated celebrations.'),
    (v_wedding_id, 'Casa dos Arcos Boavista',            'venue', 'salão',       'researching', 130,   NULL,  80,  250,  5.0, 'Imposing architecture with custom decoration service. Sophistication and elegance in the heart of Porto. Responds within 24 hours.'),
    (v_wedding_id, 'Colina do Romão',                    'venue', 'quinta',      'researching',  88,   NULL,  50,  250,  5.0, 'Between Minho and Douro — a unique space for couples who love green landscapes. Feel like royalty in a fairy-tale setting.'),
    (v_wedding_id, 'Quinta do Outeiro',                  'venue', 'quinta',      'researching', NULL, 5500, NULL,  200,  5.0, '17th-century restored manor house surrounded by green vineyards and agricultural landscapes. Venue rental from €5,500.'),
    (v_wedding_id, 'Restaurante Casa da Música',         'venue', 'restaurante', 'researching',  35,   NULL,  15,  550, NULL, 'Top floor of the iconic Casa da Música. Contemporary sophistication, signature cuisine, and impeccable service.'),
    (v_wedding_id, 'Infante Sagres',                     'venue', 'hotel',       'researching',  75,   NULL,  10,   90,  5.0, '5-star hotel in the vibrant heart of Porto. Stunning location, luxurious suites, and refined event spaces.'),
    (v_wedding_id, 'Mosteiro São Bento da Vitória',      'venue', 'salão',       'researching', 140,   NULL, 100,  400,  4.5, 'Idyllic former monastery, classified national monument since 1977. Singular and distinctive venue in Porto.'),
    (v_wedding_id, 'Quinta Vila Verde',                  'venue', 'quinta',      'researching',  90,   NULL,  60,  300,  4.9, 'Tradition and modernity united across three different spaces, ideal for receiving your event.'),
    (v_wedding_id, 'Escondidinho Terrace',               'venue', 'restaurante', 'researching',  85,   NULL,  10,  120,  5.0, 'Historic centre of Porto. Combination of simplicity and elegance for unforgettable celebrations. Responds within 24 hours.'),
    (v_wedding_id, 'Quinta da Maria',                    'venue', 'quinta',      'researching',  70,   NULL,  60,  250, NULL, 'Rural serenity connecting mountain to river. A love-story venue across generations.'),
    (v_wedding_id, 'Quinta Largo da Vila',               'venue', 'quinta',      'researching', 100,   NULL, NULL,  250,  5.0, 'A place where the day becomes a narrative to feel and smile through. Beautiful gardens and cosy detail.'),
    (v_wedding_id, 'Quinta Del Rei - Wedding Signature', 'venue', 'quinta',      'researching', 100,   NULL,  80,  430,  5.0, 'Where nature meets history. A refuge of excellence with absolute privacy and an unforgettable journey. Responds within 24 hours.'),
    (v_wedding_id, 'Quinta do Vieira',                   'venue', 'quinta',      'researching',  95,   NULL,  50,  250,  4.9, 'Located at the heart of Porto. Carefully produced experience with a dedicated production team. Responds within 24 hours.'),
    (v_wedding_id, 'Praia Da Luz',                       'venue', 'praia',       'researching', 100,   NULL,  25,  100,  4.9, 'Where everything is light. The blue Atlantic and rocky sculptures form a dreamlike backdrop. Romance illuminated at night.'),
    (v_wedding_id, 'Castelo Santa Catarina',             'venue', 'hotel',       'researching',  50,   NULL,  20,   50,  4.6, 'Early-20th-century castle with incomparable architecture and beauty. Surrounded by gardens and unique tiled walls.'),
    (v_wedding_id, 'Quinta das Tulipas',                 'venue', 'quinta',      'researching',  75,   NULL,  50,  350,  5.0, 'Reference event space where sophistication and refinement harmonise with the surrounding landscape.'),
    (v_wedding_id, 'Penafiel Park Hotel',                'venue', 'hotel',       'researching',  50,   NULL,  25,  350,  5.0, 'Distinctive atmosphere that transforms naturally to make your wedding dream come true.'),
    (v_wedding_id, 'Restaurante Caetano',                'venue', 'restaurante', 'researching',  40,   NULL,   1,   90, NULL, '37 years serving the true soul of Portuguese cuisine on Avenida de Fernão de Magalhães, Porto.'),
    (v_wedding_id, 'The Space by BOA',                   'venue', 'salão',       'researching', 615,   NULL,   1,   40, NULL, 'Luxurious event space at the top of the city with panoramic views over Porto''s skyline. Tradition meets pure elegance.'),
    (v_wedding_id, 'Renaissance Porto Lapa Hotel',       'venue', 'hotel',       'researching', 156,   NULL,  20,  300, NULL, 'Historic centre of Porto, in the emblematic Lapa district. Stunning rooftop and infinity pool with skyline views.'),
    (v_wedding_id, 'Restaurante da Fundação',            'venue', 'restaurante', 'researching',  70,   NULL,  10,  250,  5.0, 'Located in the Fundação Dr. António Cupertino de Miranda. Spacious, sophisticated hall ideal for refined banquets.'),
    (v_wedding_id, 'Cacau Wine Terrace',                 'venue', 'restaurante', 'researching',  50,   NULL,  15,   60, NULL, 'Fabulous restaurant in the centre of Porto. Experienced and welcoming team for unique cocktail receptions.'),
    (v_wedding_id, 'Sheraton Porto Hotel & Spa',         'venue', 'hotel',       'researching',  77.5, NULL,  10,  600,  5.0, 'Marvel of modern architecture combining fine arts, design, and comfort. Surrounded by century-old trees.'),
    (v_wedding_id, 'Quinta dos Afonsos',                 'venue', 'quinta',      'researching',  75,   NULL,  50,  110,  5.0, 'Comfort and privacy for unique, personalised receptions, with a specialised team supporting the entire process.'),
    (v_wedding_id, 'Vincci Porto',                       'venue', 'hotel',       'researching',  30,   NULL, NULL,  100,  5.0, 'Modern art-deco hotel in a historic 1930s building near Porto''s historic centre. Eclectic and distinctive.'),
    (v_wedding_id, 'Crowne Plaza Porto',                 'venue', 'hotel',       'researching',  73.5, NULL, NULL,  260,  5.0, 'Supreme sophistication and comfort. Modern facilities to host your celebration in great style.'),
    (v_wedding_id, 'Jardins do Porto',                   'venue', 'hotel',       'researching',  70,   NULL,  10,   30, NULL, 'Boutique hotel in the heart of the city. Historic charm, enchanting gardens, and personalised service for intimate weddings.'),
    (v_wedding_id, 'Palácio Ateneu Comercial - Lowe',    'venue', 'salão',       'researching',  50,   NULL,  60,  150, NULL, 'Royal-wedding scenery where every corner emanates refinement. A true fairy tale in pure charm.'),
    (v_wedding_id, 'O Comercial',                        'venue', 'restaurante', 'researching',  30,   NULL,  10,   60,  5.0, 'Progressive Portuguese cuisine restaurant in the Palácio da Bolsa. Wide windows overlooking the Douro river.'),
    (v_wedding_id, 'Hotel Carris Porto Ribeira',         'venue', 'hotel',       'researching',  35,   NULL,  15,  250,  5.0, 'Located in the centre of Porto in a UNESCO heritage building. Celebrate with family and friends with stunning views.'),
    (v_wedding_id, 'BH',                                 'venue', 'restaurante', 'researching', NULL,  NULL, NULL, NULL, NULL, 'Reference event venue on Avenida do Brasil, Foz do Porto. Stunning sea views in a 1945 modernist building by architect Amoroso Lopes.');
END;
$$;
