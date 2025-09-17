-- Insert mock providers with coordinates around Tel Aviv
INSERT INTO public.pro_profiles (
  id, 
  user_id, 
  bio, 
  company_name, 
  service_radius_km, 
  base_city, 
  lat, 
  lng, 
  verification_status,
  avg_price_hint
) VALUES 
  (
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1),
    'Professional plumber with 10+ years experience',
    'AquaFix Solutions', 
    15, 
    'Tel Aviv', 
    32.0853, 
    34.7818, 
    'verified',
    50
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1),
    'Expert electrician for home and business',
    'PowerPro Electric', 
    20, 
    'Tel Aviv', 
    32.0900, 
    34.7750, 
    'verified',
    75
  ),
  (
    gen_random_uuid(),
    (SELECT id FROM auth.users LIMIT 1),
    'Home cleaning service with eco-friendly products',
    'GreenClean Co', 
    25, 
    'Tel Aviv', 
    32.0700, 
    34.7900, 
    'verified',
    40
  )
ON CONFLICT (id) DO NOTHING;